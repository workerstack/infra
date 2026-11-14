import type { Answer } from "../../shared/__fixtures__/fake-client.ts";

/** What the fake Access API holds; anything not given is a healthy default for scope `dev`. */
export type AccessLive = {
  apps?: object[];
  idps?: object[];
  orgThrows?: boolean;
  policies?: object[];
  tokens?: object[];
};

export const GOOGLE_IDP = { config: { client_id: "gid_123" }, id: "idp_abc", name: "Google (dev)", type: "google" };
export const SERVICE_TOKEN = { client_id: "cid_abc", id: "tok_xyz", name: "example-access-dev" };
export const ACCESS_APP = {
  allowed_idps: ["idp_abc"],
  aud: "aud_1",
  id: "app_123",
  name: "Example Admin (dev)",
  self_hosted_domains: ["example.com/v1/admin/*"],
  session_duration: "8h",
};
export const POLICIES = [
  { decision: "service_auth", id: "p1", name: "infra service auth" },
  { decision: "allow", id: "p2", name: "infra allow emails" },
];

/** An answer for the Access reads of `verifyAccessConfig`, wrapped in `{ result }` as Cloudflare lists them. */
export function accessAnswer(live: AccessLive = {}): Answer {
  return ({ path }) => {
    if (path.includes("/access/organizations")) {
      if (live.orgThrows === true) throw new Error("CF 404");

      return { auth_domain: "team.cloudflareaccess.com", name: "team" };
    }

    if (path.includes("/identity_providers")) return { result: live.idps ?? [GOOGLE_IDP] };

    if (path.includes("/service_tokens")) return { result: live.tokens ?? [SERVICE_TOKEN] };

    if (path.includes("/policies")) return { result: live.policies ?? POLICIES };

    if (path.includes("/access/apps")) return { result: live.apps ?? [ACCESS_APP] };

    throw new Error(`unexpected: ${path}`);
  };
}
