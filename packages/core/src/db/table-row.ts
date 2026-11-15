/** One `sqlite_master` row of a live database. */
export type TableRow = { name: string; sql: string | null; type: string };
