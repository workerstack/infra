import * as z from "zod";

import type { JsonObject } from "./json-object.ts";

/** The strings a JSON object lists at `key`; none when it lists no strings there. */
export function stringsAt(object: JsonObject | undefined, key: string): string[] {
  return z.array(z.string()).safeParse(object?.[key]).data ?? [];
}
