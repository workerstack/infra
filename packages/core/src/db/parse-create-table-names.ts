import { CREATE_TABLE } from "./sql-tables.constants.ts";

/** The names of the tables the SQL creates, comment lines left out. */
export function parseCreateTableNames(sql: string): string[] {
  const uncommented = sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

  return [...uncommented.matchAll(CREATE_TABLE)].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));
}
