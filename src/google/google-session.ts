import type { CfFetch } from "../api/cf-fetch.ts";

/** A service account and the `fetch` that calls Google for it. */
export type GoogleSession = { clientEmail: string; fetcher: CfFetch; privateKey: string };
