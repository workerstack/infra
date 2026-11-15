import { IDENT } from "./sql-tables.constants.ts";

/** The table name double-quoted; a name that is not a plain identifier is refused. */
export function quoteIdent(name: string): string {
  if (!IDENT.test(name)) throw new Error(`Refusing non-identifier table name: ${name}`);

  return `"${name}"`;
}
