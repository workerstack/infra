import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { ChildEnv } from "../child-env.ts";
import type { DbIo, DbRun } from "./db-io.ts";
import { SQL_FILE_MODE } from "./sql-file-mode.constants.ts";
import { wranglerD1Args } from "./wrangler-d1-args.ts";

/** What runs a wipe's SQL: the database through its config, the SQL, and where wrangler runs. */
export type SqlFileRun = {
  binding: string;
  configPath: string;
  cwd: string;
  databaseName: string;
  env: ChildEnv;
  sql: string;
};

/** Writes the SQL to a temp file in the OS temp dir, runs it with `wrangler d1 execute --file`, removes the file. */
export async function runSqlFile(io: DbIo, run: SqlFileRun): Promise<DbRun> {
  const file = join(tmpdir(), `d1-wipe-${run.binding}-${Date.now()}.sql`);

  writeFileSync(file, run.sql, { mode: SQL_FILE_MODE });

  try {
    const args = wranglerD1Args({ configPath: run.configPath, databaseName: run.databaseName, sql: { file } });

    return await io.spawn("wrangler", args, { cwd: run.cwd, env: run.env });
  } finally {
    rmSync(file, { force: true });
  }
}
