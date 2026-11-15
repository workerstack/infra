import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parseCreateTableNames } from "./parse-create-table-names.ts";

/** The tables the `.sql` files of a migrations directory create. */
export function readSchemaTableNames(dir: string): Set<string> {
  if (!existsSync(dir)) throw new Error(`migrations dir does not exist: ${dir}`);

  const files = readdirSync(dir).filter((file) => file.endsWith(".sql"));

  return new Set(files.flatMap((file) => parseCreateTableNames(readFileSync(join(dir, file), "utf8"))));
}
