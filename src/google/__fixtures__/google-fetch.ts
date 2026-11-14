import type { CfFetch } from "../../api/cf-fetch.ts";

/** One request a Google fake received. */
export type GoogleCall = { init: RequestInit; url: string };

/** A fetch that records requests; the token URL answers a token, a site URL `status` with `body`. */
export function googleFetch(status: number, body: object): { calls: GoogleCall[]; fetcher: CfFetch } {
  const calls: GoogleCall[] = [];

  return {
    calls,
    fetcher: (url, init) => {
      calls.push({ init, url });

      if (url === "https://oauth2.googleapis.com/token")
        return Promise.resolve(new Response(JSON.stringify({ access_token: "tok1" })));

      return Promise.resolve(new Response(JSON.stringify(body), { status }));
    },
  };
}
