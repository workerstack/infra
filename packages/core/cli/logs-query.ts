import { realLogsHost } from "../src/logs/real-logs-host.ts";
import { realQueryDeps } from "../src/logs/real-query-deps.ts";
import { runLogsQuery } from "../src/logs/run-logs-query.ts";

export function main(args: readonly string[]): Promise<number> {
  return runLogsQuery(args, realLogsHost(), realQueryDeps());
}
