import type { CfFetch } from "../cf-fetch.ts";

export type Sent = { init: RequestInit; url: string };

export type FakeFetch = { calls: Sent[]; fetcher: CfFetch };

/** A fetch that records every request and answers each with `body` as JSON. */
export function fakeFetch(body: object): FakeFetch {
  const calls: Sent[] = [];

  return {
    calls,
    fetcher: (url, init) => {
      calls.push({ init, url });

      return Promise.resolve(new Response(JSON.stringify(body)));
    },
  };
}

/** A successful envelope around `result`. */
export function okBody(result: object | null): object {
  return { errors: [], result, success: true };
}
