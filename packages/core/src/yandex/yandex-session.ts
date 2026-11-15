import type { CfFetch } from "../api/cf-fetch.ts";

/** An authorized Webmaster API session: the API base, the fetch it goes through and the OAuth token. */
export type YandexSession = { base: string; fetcher: CfFetch; token: string };
