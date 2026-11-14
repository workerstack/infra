import type { CfAuth } from "./auth.ts";
import type { CfFetch } from "./cf-fetch.ts";
import { cfRequest } from "./cf-request.ts";
import type { CfBody } from "./cf-request.ts";

export type CfClient = {
  request: <T = unknown>(method: string, path: string, body?: CfBody) => Promise<T>;
  zoneId: string;
};

function authHeaders(auth: CfAuth): Record<string, string> {
  return auth.type === "token"
    ? { Authorization: `Bearer ${auth.token}` }
    : { "X-Auth-Email": auth.email, "X-Auth-Key": auth.key };
}

/** A client for one zone. A failed envelope throws `CF API ${method} ${path}: ${messages}`. */
export function createClient(auth: CfAuth, zoneId: string, fetcher: CfFetch = fetch): CfClient {
  const headers = { "Content-Type": "application/json", ...authHeaders(auth) };

  return {
    request: <T = unknown>(method: string, path: string, body?: CfBody): Promise<T> =>
      cfRequest<T>({ body, headers, label: "CF API", method, path }, fetcher),
    zoneId,
  };
}
