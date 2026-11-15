import * as z from "zod";

import type { JsonObject } from "./json-object.ts";

/** A JSON object of any keys: what the converted Wrangler config and each of its entries are parsed as. */
export function jsonObjectSchema(): z.ZodType<JsonObject> {
  return z.record(z.string(), z.json());
}
