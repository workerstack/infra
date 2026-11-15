import { jsonObjectSchema } from "./json-object-schema.ts";
import type { JsonObject } from "./json-object.ts";

/** The object a JSON object holds at `key`; `undefined` when it holds none there. */
export function objectAt(object: JsonObject, key: string): JsonObject | undefined {
  return jsonObjectSchema().safeParse(object[key]).data;
}
