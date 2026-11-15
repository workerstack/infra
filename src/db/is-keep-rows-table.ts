import { D1_MIGRATIONS, DRIZZLE_MIGRATIONS, SQLITE_SEQUENCE } from "./sql-tables.constants.ts";

/** Whether a wipe leaves the table's rows alone: migration records, Cloudflare tables and SQLite internals. */
export function isKeepRowsTable(name: string): boolean {
  if (name === D1_MIGRATIONS || name === DRIZZLE_MIGRATIONS) return true;

  if (name.startsWith("_cf_")) return true;

  return name.startsWith("sqlite_") && name !== SQLITE_SEQUENCE;
}
