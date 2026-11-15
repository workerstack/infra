import type { CfFetch } from "../api/cf-fetch.ts";
import type { IndexNowConfig } from "../schema/index-now-config.ts";
import type { Log } from "../shared/log.ts";

/** What an IndexNow runner needs: the config, the resolved host, and the edges a test swaps. */
export type IndexNowTarget = { apiUrl?: string; config: IndexNowConfig; fetcher?: CfFetch; host: string; log?: Log };
