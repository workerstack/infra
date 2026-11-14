import type { CfFetch } from "../../api/cf-fetch.ts";

export type PreloadFetch = { fetcher: CfFetch; urls: string[] };

/** A fetch answering every call with `body` as JSON and `init`, recording the URLs. */
export function fakePreloadFetch(body: string, init: ResponseInit = { status: 200 }): PreloadFetch {
  const urls: string[] = [];

  return {
    fetcher: (url) => {
      urls.push(url);

      return Promise.resolve(new Response(body, init));
    },
    urls,
  };
}
