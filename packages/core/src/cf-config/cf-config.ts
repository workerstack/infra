import type { resolveAndParseConfig } from "@cloudflare/config";

import type { BundlerSettings } from "./bundler-settings.ts";
import type { JsonObject } from "./json-object.ts";

type Parsed = Extract<Awaited<ReturnType<typeof resolveAndParseConfig>>, { success: true }>["data"];

/** Cloudflare's own parse of a Worker: bindings, triggers, exports, observability. */
export type ParsedWorker = NonNullable<Parsed["worker"]>;

/**
 * A Worker package's `cloudflare.config.ts` read for one scope: the parsed Worker, its Wrangler config, and the build
 * settings `infra.worker` carried beside the default export (`{}` for any other export).
 */
export type CfConfig = { build: BundlerSettings; worker: ParsedWorker; wrangler: JsonObject };
