import { realLogsHost } from "../src/logs/real-logs-host.ts";
import { realTailDeps } from "../src/logs/real-tail-deps.ts";
import { runLogsTail } from "../src/logs/run-logs-tail.ts";

export function main(args: readonly string[]): Promise<number> {
  return runLogsTail(args, realLogsHost(), realTailDeps());
}
