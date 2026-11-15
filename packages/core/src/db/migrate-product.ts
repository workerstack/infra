import { loadProductKit } from "../cf-config/load-product-kit.ts";
import type { Product } from "../products.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import type { DbIo } from "./db-io.ts";
import type { DbScope } from "./db-scope.ts";
import { migrateBinding } from "./migrate-binding.ts";
import type { MigrationResult } from "./migration-result.ts";
import { reportResults } from "./report-results.ts";

const HEADER = ["BINDING", "DATABASE", "STATUS", "APPLIED", "TIME"];

function rowOf(result: MigrationResult): { cells: string[]; note?: string } {
  const cells = [
    result.binding,
    result.databaseName,
    result.status,
    String(result.migrationsApplied),
    `${result.durationMs}ms`,
  ];

  return result.note === undefined ? { cells } : { cells, note: result.note };
}

/**
 * Applies the migrations of each D1 binding the product has in `scope`, one after another, and prints the summary.
 * The credentials are read before the kit loads or any program runs; a failed binding fails the product after it.
 */
export async function migrateProduct(product: Product, scope: DbScope, io: DbIo): Promise<void> {
  const env = io.env(product);
  const kit = await loadProductKit(product.root);
  const d1 = Object.entries(product.config.cloudflare?.bindings[scope]?.d1_databases ?? {});
  const results: MigrationResult[] = [];

  await runInOrder(d1, async ([binding, database]) => {
    results.push(await migrateBinding({ binding, databaseName: database.database_name, env, io, kit, product, scope }));
  });

  reportResults(io, product, { failed: (result) => result.status === "failed", header: HEADER, results, rowOf });
}
