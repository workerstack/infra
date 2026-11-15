import type { resolveAndParseConfig } from "@cloudflare/config";

import type { JsonObject } from "./json-object.ts";

type Parsed = Extract<Awaited<ReturnType<typeof resolveAndParseConfig>>, { success: true }>["data"];

/** Cloudflare's own parse of a Worker: bindings, triggers, exports, observability. */
export type ParsedWorker = NonNullable<Parsed["worker"]>;

/** A Worker package's `cloudflare.config.ts` read for one scope: the parsed Worker and its Wrangler config. */
export type CfConfig = { worker: ParsedWorker; wrangler: JsonObject };
