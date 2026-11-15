import { writeFileSync } from "node:fs";
import { join } from "node:path";

import type { CfAccountClient } from "../api/account-client.ts";
import { FAILURE_EXIT } from "../failure-exit.constants.ts";
import { posixRelative } from "../shared/posix-relative.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { dumpDir } from "../workers/dump-dir.ts";
import { stamp } from "../workers/stamp.ts";
import type { WorkerTarget } from "../workers/worker-target.ts";
import { buildQueryBody } from "./build-query-body.ts";
import type { LogsHost } from "./logs-host.ts";
import type { QueryArgs } from "./query-args.ts";
import type { QueryDeps } from "./query-deps.ts";
import { samplingWarning } from "./sampling-warning.ts";
import { summarizeResult } from "./summarize-result.ts";
import type { TelemetryResult } from "./telemetry-result.ts";
import { timeframe } from "./timeframe.ts";

export type QueryRun = { args: QueryArgs; deps: QueryDeps; host: LogsHost; root: string };

type Asker = { client: CfAccountClient; target: WorkerTarget };

function windowLabel(args: QueryArgs, now: number): string {
  if (args.from === undefined) return `last ${args.minutes}m`;

  const { from, to } = timeframe(args, now);

  return `${new Date(from).toISOString()} → ${new Date(to).toISOString()}`;
}

async function ask(asker: Asker, run: QueryRun): Promise<void> {
  const { args, deps, host, root } = run;
  const { scriptName } = asker.target;
  const now = deps.now();

  const result = await asker.client.request<TelemetryResult>(
    "POST",
    "/workers/observability/telemetry/query",
    buildQueryBody(args, scriptName, now),
  );

  const file = join(dumpDir(root, "query"), `${stamp()}-${scriptName}-${args.view}.json`);

  writeFileSync(file, JSON.stringify(result, null, "\t"));

  const lines = summarizeResult(args.view, result);

  host.stdout(
    `## ${scriptName} ${args.view} ${windowLabel(args, now)}: ${lines.length} rows → ${posixRelative(root, file)}`,
  );

  const warning = samplingWarning(args.view, result);

  if (warning !== undefined) host.stdout(warning);

  for (const line of lines) host.stdout(line);
}

/** Queries each target's script in order: the dump and a summary for each; a failed one is named and the rest go on. */
export async function queryTargets(targets: WorkerTarget[], run: QueryRun): Promise<number> {
  // Credentials are read for every Worker first, so a missing one fails before any request.
  const askers = targets.map((target) => {
    const { env } = target.worker.product.config;

    return { client: run.deps.client(env), target };
  });

  const failures: string[] = [];

  await runInOrder(askers, async (asker) => {
    try {
      await ask(asker, run);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      run.host.stderr(`${asker.target.scriptName}: ${message}`);
      failures.push(asker.target.scriptName);
    }
  });

  return failures.length > 0 ? FAILURE_EXIT : 0;
}
