import type { CfFetch } from "../../api/cf-fetch.ts";

/** A fetch that answers every call with `status` and an empty object. */
export function statusFetch(status: number): CfFetch {
  return () => Promise.resolve(new Response("{}", { status }));
}
