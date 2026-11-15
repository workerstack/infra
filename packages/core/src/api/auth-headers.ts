import type { CfAuth } from "./auth.ts";

/** The headers that sign a request: a Bearer token, or the account email with its global key. */
export function authHeaders(auth: CfAuth): Record<string, string> {
  return auth.type === "token"
    ? { Authorization: `Bearer ${auth.token}` }
    : { "X-Auth-Email": auth.email, "X-Auth-Key": auth.key };
}
