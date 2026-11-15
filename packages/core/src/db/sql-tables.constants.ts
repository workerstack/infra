/** The table `wrangler d1 migrations` records applied files in. */
export const D1_MIGRATIONS = "d1_migrations";

/** The table Drizzle records applied files in. */
export const DRIZZLE_MIGRATIONS = "__drizzle_migrations";

/** SQLite's autoincrement counters: emptied with the tables, never dropped. */
export const SQLITE_SEQUENCE = "sqlite_sequence";

/** The `sqlite_master` type of a table. */
export const TABLE = "table";

/** What lists the live tables of a database. */
export const LIST_TABLES_SQL = "SELECT name, type, sql FROM sqlite_master WHERE type = 'table' ORDER BY name";

/** A table name safe to quote into a statement. */
export const IDENT: RegExp = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** The table a `CREATE TABLE` statement names. */
export const CREATE_TABLE: RegExp =
  /CREATE\s+(?:VIRTUAL\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?([A-Za-z_][A-Za-z0-9_]*)/gi;

/** The line a wipe runs first: D1 rejects BEGIN and COMMIT, so foreign keys are deferred instead. */
export const DEFER_FOREIGN_KEYS_ON = "PRAGMA defer_foreign_keys = ON;";

/** The line a wipe runs last. */
export const DEFER_FOREIGN_KEYS_OFF = "PRAGMA defer_foreign_keys = OFF;";
