import type { CfFetch } from "../api/cf-fetch.ts";

/** A Graph bearer token and the `fetch` that sends it. */
export type GraphClient = { fetcher: CfFetch; token: string };
