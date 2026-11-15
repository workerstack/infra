import type { LogsHost } from "./logs-host.ts";
import { parseTailArgs } from "./parse-tail-args.ts";
import { runLogsCommand } from "./run-logs-command.ts";
import type { TailDeps } from "./tail-deps.ts";
import { tailTargets } from "./tail-targets.ts";
import { TAIL_USAGE } from "./tail.constants.ts";

/** `infra logs-tail`: tails the picked Workers; the dump and one line per event are the output. */
export function runLogsTail(args: readonly string[], host: LogsHost, deps: TailDeps): Promise<number> {
  return runLogsCommand(
    {
      name: "logs-tail",
      parse: parseTailArgs,
      usage: TAIL_USAGE,
      work: (run) => tailTargets(run.targets, { args: run.args, deps, host, root: run.root }),
    },
    args,
    host,
  );
}
