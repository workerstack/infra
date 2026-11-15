import { z } from "zod";

import { extractJsonValue } from "./extract-json-value.ts";
import type { TableRow } from "./table-row.ts";

/** The live tables in the first result of `wrangler d1 execute --json` over `sqlite_master`. */
export function parseTableRows(stdout: string): TableRow[] {
  const row = z.object({ name: z.string(), sql: z.string().nullish(), type: z.string().optional() });
  const parsed = z.array(z.object({ results: z.array(row) })).safeParse(extractJsonValue(stdout));
  const first = parsed.success ? parsed.data[0] : undefined;

  if (first === undefined) throw new Error("wrangler --json missing results[]");

  return first.results.map((found) => ({ name: found.name, sql: found.sql ?? null, type: found.type ?? "table" }));
}
