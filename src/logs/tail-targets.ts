import { appendFileSync } from "node:fs";
import { join, relative } from "node:path";

import { FAILURE_EXIT } from "../failure-exit.constants.ts";
import { dumpDir } from "../workers/dump-dir.ts";
import { stamp } from "../workers/stamp.ts";
import type { WorkerTarget } from "../workers/worker-target.ts";
import type { LogsHost } from "./logs-host.ts";
import { MS_PER_MINUTE } from "./logs.constants.ts";
import { pumpTail } from "./pump-tail.ts";
import type { TailArgs } from "./tail-args.ts";
import type { TailDeps } from "./tail-deps.ts";
import type { TailLaunch } from "./tail-launch.ts";
import { tailStop } from "./tail-stop.ts";

export type TailRun = { args: TailArgs; deps: TailDeps; host: LogsHost; root: string };

// The env of every Worker is read first, so a missing credential fails before any child starts.
function launchesOf(targets: WorkerTarget[], run: TailRun): TailLaunch[] {
  return targets.map((target) => {
    const { args, file } = run.deps.program(run.root, [
      "tail",
      target.scriptName,
      "--format",
      "json",
      ...run.args.passThrough,
    ]);

    return { args, cwd: run.root, env: run.deps.childEnv(target.worker.product.config.env), file };
  });
}

/** Tails every target at once, one child each, into one dump, until the minutes pass, a stop or every child ends. */
export async function tailTargets(targets: WorkerTarget[], run: TailRun): Promise<number> {
  const { args, host } = run;
  const launches = launchesOf(targets, run);
  const file = join(dumpDir(run.root, "tail"), `${stamp()}-${args.scope}.ndjson`);
  const until = args.minutes === 0 ? "until killed" : `${args.minutes}m`;

  appendFileSync(file, "");
  host.stdout(`tail ${targets.map((target) => target.scriptName).join(", ")} (${until}) → ${relative(run.root, file)}`);

  const sink = { dump: (line: string) => appendFileSync(file, `${line}\n`), stderr: host.stderr, stdout: host.stdout };
  const children = launches.map((launch) => run.deps.spawn(launch));
  const { stop, wasStopped } = tailStop(children);
  const off = host.onStop(stop);
  const timer = args.minutes > 0 ? setTimeout(stop, args.minutes * MS_PER_MINUTE) : undefined;

  try {
    const codes = await Promise.all(children.map((child, at) => pumpTail(child, targets[at]?.scriptName ?? "", sink)));

    return !wasStopped() && codes.some((code) => code !== 0) ? FAILURE_EXIT : 0;
  } finally {
    clearTimeout(timer);
    off();
  }
}
