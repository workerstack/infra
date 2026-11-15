import { authHeaders } from "./auth-headers.ts";
import type { CfAuth } from "./auth.ts";
import type { CfFetch } from "./cf-fetch.ts";
import { cfRequest } from "./cf-request.ts";
import type { CfBody } from "./cf-request.ts";

/** A Cloudflare API client bound to one zone. */
export type CfClient = {
  /** Sends one API call and resolves the result. Rejects when Cloudflare reports a failure. */
  request: <T = unknown>(method: string, path: string, body?: CfBody) => Promise<T>;
  /** The id of the zone this client works on. */
  zoneId: string;
};

/** A client for one zone. A failed envelope throws `CF API ${method} ${path}: ${messages}`. */
export function createClient(auth: CfAuth, zoneId: string, fetcher: CfFetch = fetch): CfClient {
  const headers = { "Content-Type": "application/json", ...authHeaders(auth) };

  return {
    request: <T = unknown>(method: string, path: string, body?: CfBody): Promise<T> =>
      cfRequest<T>({ body, headers, label: "CF API", method, path }, fetcher),
    zoneId,
  };
}
