import type { CfFetch } from "../api/cf-fetch.ts";
import type { RedirectRule } from "../operations/redirect-rule.ts";
import type { Log } from "../shared/log.ts";

/**
 * Where `applyZoneConfig` prints (default stdout), the `fetch` it reaches hstspreload.org with, and the zone's
 * whole redirect list to write.
 */
export type ZoneApplyOptions = { fetcher?: CfFetch; log?: Log; redirects?: readonly RedirectRule[] };
