import type { Product } from "../products.ts";
import type { DbIo } from "./db-io.ts";
import { formatTable, type TableRow } from "./format-table.ts";

/** What a product's summary prints: the column titles, each binding's result, its row and whether it failed. */
export type Report<R> = {
  failed: (result: R) => boolean;
  header: readonly string[];
  results: readonly R[];
  rowOf: (result: R) => TableRow;
};

/** Prints the product's summary table; fails with how many bindings failed after it, when any did. */
export function reportResults<R>(io: DbIo, product: Product, report: Report<R>): void {
  io.print(formatTable(product.name, report.header, report.results.map(report.rowOf)));

  const count = report.results.filter(report.failed).length;

  if (count > 0) throw new Error(`${count} of ${report.results.length} databases failed`);
}
