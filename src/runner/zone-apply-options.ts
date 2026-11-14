import type { CfFetch } from "../api/cf-fetch.ts";
import type { Log } from "../shared/log.ts";

/** Where `applyZoneConfig` prints (default stdout) and the `fetch` it reaches hstspreload.org with. */
export type ZoneApplyOptions = { fetcher?: CfFetch; log?: Log };
