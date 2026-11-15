import { loadProductKit } from "../cf-config/load-product-kit.ts";
import type { Product } from "../products.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import type { DbIo } from "./db-io.ts";
import { PROD_SCOPE } from "./db-scopes.constants.ts";
import type { DbArgs } from "./parse-db-args.ts";
import { reportResults } from "./report-results.ts";
import { wipeBinding } from "./wipe-binding.ts";
import type { WipeResult } from "./wipe-result.ts";

const HEADER = ["BINDING", "DATABASE", "STATUS", "DELETED", "DROPPED", "TIME"];

function rowOf(result: WipeResult): { cells: string[]; note?: string } {
  const cells = [
    result.binding,
    result.databaseName,
    result.status,
    String(result.deleted),
    String(result.dropped),
    `${result.durationMs}ms`,
  ];

  return result.note === undefined ? { cells } : { cells, note: result.note };
}

function pick<T>(all: Record<string, T>, names: readonly string[]): [string, T][] {
  const unknown = names.filter((name) => !Object.hasOwn(all, name));

  if (unknown.length > 0)
    throw new Error(`Unknown binding ${unknown.join(", ")}. Available: ${Object.keys(all).join(", ")}`);

  return Object.entries(all).filter(([name]) => names.length === 0 || names.includes(name));
}

/**
 * Wipes the D1 databases the product has in the scope, one after another, and prints the summary. A prod wipe
 * needs `--force`, and is refused before any credential is read; a failed binding fails the product after it.
 */
export async function wipeProduct(product: Product, args: DbArgs, io: DbIo): Promise<void> {
  if (args.scope === PROD_SCOPE && !args.force) throw new Error("Refusing to wipe prod. Pass --force if you meant it.");

  const env = io.env(product);
  const kit = await loadProductKit(product.root);
  const d1 = pick(product.config.cloudflare?.bindings[args.scope]?.d1_databases ?? {}, args.bindings);
  const results: WipeResult[] = [];

  await runInOrder(d1, async ([binding, database]) => {
    const input = {
      binding,
      databaseName: database.database_name,
      dryRun: args.dryRun,
      env,
      io,
      kit,
      product,
      scope: args.scope,
    };

    results.push(await wipeBinding(input));
  });

  reportResults(io, product, { failed: (result) => result.status === "failed", header: HEADER, results, rowOf });
}
