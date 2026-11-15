import { realHost } from "../src/command/real-host.ts";
import { realDbIo } from "../src/db/real-db-io.ts";
import { runDbWipe } from "../src/db/run-db-wipe.ts";

export function main(args: readonly string[]): Promise<number> {
  const host = realHost();

  return runDbWipe(args, host, realDbIo(host));
}
