import { realHost } from "../src/command/real-host.ts";
import { realDbIo } from "../src/db/real-db-io.ts";
import { runDbMigrate } from "../src/db/run-db-migrate.ts";

export function main(args: readonly string[]): Promise<number> {
  const host = realHost();

  return runDbMigrate(args, host, realDbIo(host));
}
