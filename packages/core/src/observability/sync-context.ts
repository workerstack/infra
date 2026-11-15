import type { CfFetch } from "../api/cf-fetch.ts";
import type { Log } from "../shared/log.ts";

/** What syncing one Worker needs: whether to write, the Cloudflare fetch and both output lines. */
export type SyncContext = { apply: boolean; fetcher: CfFetch; stderr: Log; stdout: Log };
