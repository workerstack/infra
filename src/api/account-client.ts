import { authHeaders } from "./auth-headers.ts";
import type { CfAuth } from "./auth.ts";
import type { CfFetch } from "./cf-fetch.ts";
import { cfRequest } from "./cf-request.ts";
import type { CfBody } from "./cf-request.ts";

export type CfAccountClient = {
  accountId: string;
  /** `path` is relative to the account: `/workers/scripts` calls `/accounts/${accountId}/workers/scripts`. */
  request: <T = unknown>(method: string, path: string, body?: CfBody) => Promise<T>;
};

/** A client for one account. A failed envelope throws `CF API ${method} /accounts/${accountId}${path}: ${messages}`. */
export function createAccountClient(auth: CfAuth, accountId: string, fetcher: CfFetch = fetch): CfAccountClient {
  const headers = { "Content-Type": "application/json", ...authHeaders(auth) };

  return {
    accountId,
    request: <T = unknown>(method: string, path: string, body?: CfBody): Promise<T> =>
      cfRequest<T>({ body, headers, label: "CF API", method, path: `/accounts/${accountId}${path}` }, fetcher),
  };
}
