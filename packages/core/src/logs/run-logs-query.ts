import type { LogsHost } from "./logs-host.ts";
import { parseQueryArgs } from "./parse-query-args.ts";
import type { QueryDeps } from "./query-deps.ts";
import { queryTargets } from "./query-targets.ts";
import { QUERY_USAGE } from "./query.constants.ts";
import { runLogsCommand } from "./run-logs-command.ts";

/** `infra logs-query`: asks Workers Logs about the picked Workers; the dump and a summary are the output. */
export function runLogsQuery(args: readonly string[], host: LogsHost, deps: QueryDeps): Promise<number> {
  return runLogsCommand(
    {
      name: "logs-query",
      parse: parseQueryArgs,
      usage: QUERY_USAGE,
      work: (run) => queryTargets(run.targets, { args: run.args, deps, host, root: run.root }),
    },
    args,
    host,
  );
}
