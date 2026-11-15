import * as z from "zod";

import type { JsonObject } from "./json-object.ts";

/** The string a JSON object holds at `key`; `undefined` when it holds none there. */
export function stringAt(object: JsonObject | undefined, key: string): string | undefined {
  return z.string().safeParse(object?.[key]).data;
}
