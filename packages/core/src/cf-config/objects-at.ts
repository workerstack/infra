import * as z from "zod";

import { jsonObjectSchema } from "./json-object-schema.ts";
import type { JsonObject } from "./json-object.ts";

/** The list of objects a JSON object holds at `key`; `undefined` when it holds no such list there. */
export function objectsAt(object: JsonObject, key: string): JsonObject[] | undefined {
  return z.array(jsonObjectSchema()).safeParse(object[key]).data;
}
