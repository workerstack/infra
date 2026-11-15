import type { Json } from "../shared/json.ts";

/** A JSON object: a Wrangler config, or one entry of its lists. */
export type JsonObject = { [key: string]: Json };
