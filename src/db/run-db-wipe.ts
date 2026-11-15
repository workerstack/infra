import type { CommandHost } from "../command/command-host.ts";
import { runCommand } from "../command/run-command.ts";
import { usageLine } from "../command/usage-line.ts";
import { USAGE_EXIT } from "../usage-exit.constants.ts";
import type { DbIo } from "./db-io.ts";
import { DB_WIPE_USAGE_FLAGS } from "./db-usage-flags.constants.ts";
import { parseDbArgs } from "./parse-db-args.ts";
import { wipeProduct } from "./wipe-product.ts";

/**
 * `infra db-wipe [name|--all] --scope dev|prod [--binding NAME...] [--force] [--dry-run]`: clears each picked
 * product's D1 data in the scope; a prod wipe needs `--force`.
 */
export function runDbWipe(args: readonly string[], host: CommandHost, io: DbIo): Promise<number> {
  const parsed = parseDbArgs(args, { allowed: ["binding", "dry-run", "force", "scope"] });

  if (parsed === undefined) {
    host.stderr(usageLine("db-wipe", DB_WIPE_USAGE_FLAGS));

    return Promise.resolve(USAGE_EXIT);
  }

  return runCommand(
    { name: "db-wipe", usageFlags: DB_WIPE_USAGE_FLAGS, work: (product) => wipeProduct(product, parsed, io) },
    parsed.positionals,
    host,
  );
}
