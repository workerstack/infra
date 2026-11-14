import type { CfFetch } from "../../api/cf-fetch.ts";

/** A hstspreload.org status body. */
export type PreloadStatus = { message?: string; status: string };

export type PreloadFake = { fetcher: CfFetch; urls: string[] };

/** A fetch answering hstspreload.org: `preloadable` for the eligibility check, `status` for the status check. */
export function preloadFetch(preloadable: object, status: PreloadStatus): PreloadFake {
  const urls: string[] = [];

  return {
    fetcher: (url) => {
      urls.push(url);

      return Promise.resolve(new Response(JSON.stringify(url.includes("/preloadable") ? preloadable : status)));
    },
    urls,
  };
}
