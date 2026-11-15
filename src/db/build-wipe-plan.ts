import { isKeepRowsTable } from "./is-keep-rows-table.ts";
import { quoteIdent } from "./quote-ident.ts";
import { DEFER_FOREIGN_KEYS_OFF, DEFER_FOREIGN_KEYS_ON, SQLITE_SEQUENCE, TABLE } from "./sql-tables.constants.ts";
import type { TableRow } from "./table-row.ts";

/** What a wipe does: the tables it empties, the ones it drops, those it leaves, and the SQL that does it. */
export type WipePlan = { deleted: string[]; dropped: string[]; skipped: string[]; sql: string };

/**
 * Tables the schema creates are emptied; tables it does not (leftovers of an old schema) are dropped; migration
 * records, Cloudflare tables and non-tables are left. Built from the live tables, so a rerun after a partial wipe
 * plans only what is left.
 */
export function buildWipePlan(live: readonly TableRow[], schemaTables: ReadonlySet<string>): WipePlan {
  const skipped = live.filter((row) => row.type !== TABLE || isKeepRowsTable(row.name)).map((row) => row.name);
  const wipable = live.filter((row) => row.type === TABLE && !isKeepRowsTable(row.name)).map((row) => row.name);
  const deleted = wipable.filter((name) => schemaTables.has(name) || name === SQLITE_SEQUENCE);
  const dropped = wipable.filter((name) => !deleted.includes(name));

  const statements = [
    DEFER_FOREIGN_KEYS_ON,
    ...dropped.map((name) => `DROP TABLE IF EXISTS ${quoteIdent(name)};`),
    ...deleted.map((name) => `DELETE FROM ${quoteIdent(name)};`),
    DEFER_FOREIGN_KEYS_OFF,
  ];

  return { deleted, dropped, skipped, sql: statements.join("\n") };
}
