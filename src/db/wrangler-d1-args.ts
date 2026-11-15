/** What a `wrangler d1 execute` runs against a remote database: the config, the database and the SQL. */
export type D1Execute = { configPath: string; databaseName: string; sql: { command: string } | { file: string } };

/** The args of `wrangler d1 execute`: `--command` lists with `--json`; `--file` runs without it. */
export function wranglerD1Args(input: D1Execute): string[] {
  const base = ["d1", "execute", input.databaseName, "--remote", "--yes", `--config=${input.configPath}`];

  return "command" in input.sql
    ? [...base, "--json", `--command=${input.sql.command}`]
    : [...base, `--file=${input.sql.file}`];
}
