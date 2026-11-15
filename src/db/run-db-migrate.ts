import type { CommandHost } from "../command/command-host.ts";
import { runCommand } from "../command/run-command.ts";
import { usageLine } from "../command/usage-line.ts";
import { USAGE_EXIT } from "../usage-exit.constants.ts";
import type { DbIo } from "./db-io.ts";
import { PROD_SCOPE } from "./db-scopes.constants.ts";
import { DB_MIGRATE_USAGE_FLAGS } from "./db-usage-flags.constants.ts";
import { migrateProduct } from "./migrate-product.ts";
import { parseDbArgs } from "./parse-db-args.ts";

/**
 * `infra db-migrate [name|--all] [--scope dev|prod]`: applies each picked product's D1 migrations, in `prod` by
 * default.
 */
export function runDbMigrate(args: readonly string[], host: CommandHost, io: DbIo): Promise<number> {
  const parsed = parseDbArgs(args, { allowed: ["scope"], defaultScope: PROD_SCOPE });

  if (parsed === undefined) {
    host.stderr(usageLine("db-migrate", DB_MIGRATE_USAGE_FLAGS));

    return Promise.resolve(USAGE_EXIT);
  }

  return runCommand(
    {
      name: "db-migrate",
      usageFlags: DB_MIGRATE_USAGE_FLAGS,
      work: (product) => migrateProduct(product, parsed.scope, io),
    },
    parsed.positionals,
    host,
  );
}
