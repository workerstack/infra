import type { AiSearchInstanceResult } from "../../api/ai-search.ts";
import type { CfFetch } from "../../api/cf-fetch.ts";

/** What the fake AI Search API holds: the `listed` instances, those a point get finds, and whether the list fails. */
export type AiSearchLive = { failList?: boolean; getable?: AiSearchInstanceResult[]; listed?: AiSearchInstanceResult[] };

export type AiSearchFake = { fetcher: CfFetch; urls: string[] };

function ok(result: object): Response {
  return new Response(JSON.stringify({ errors: [], result, success: true }));
}

function failed(message: string): Response {
  return new Response(JSON.stringify({ errors: [{ message }], success: false }));
}

/** A fetch that answers the instances list and point gets, recording every URL. */
export function aiSearchFetch(live: AiSearchLive = {}): AiSearchFake {
  const urls: string[] = [];

  return {
    fetcher: (url) => {
      urls.push(url);

      if (url.endsWith("/instances")) return Promise.resolve(live.failList === true ? failed("auth failed") : ok(live.listed ?? []));

      const name = decodeURIComponent(url.split("/instances/")[1] ?? "");
      const found = live.getable?.find((instance) => instance.name === name);

      return Promise.resolve(found === undefined ? failed("not found") : ok(found));
    },
    urls,
  };
}

/** An instance as Cloudflare lists it. */
export function aiInstance(name: string): AiSearchInstanceResult {
  return { embedding_model: "@cf/baai/bge-base-en-v1.5", modified_on: "2024-01-01T00:00:00Z", name, status: "active" };
}
