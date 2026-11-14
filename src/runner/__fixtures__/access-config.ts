import type { CloudflareAccessApplication, CloudflareAccessEnv } from "../../schema/cloudflare-env.ts";

/** The declared admin app for scope `dev`. */
export const ADMIN_APP: CloudflareAccessApplication = {
  allowEmails: ["owner@example.com"],
  domain: "example.com",
  name: "Example Admin (dev)",
  paths: ["/v1/admin/*"],
};

/** The declared Access config for `dev`: one app, a Google IdP and a service token; `overrides` replace fields. */
export function accessEnv(overrides: Partial<CloudflareAccessEnv> = {}): CloudflareAccessEnv {
  return {
    applications: { ADMIN: ADMIN_APP },
    google: { clientId: "gid_123" },
    serviceToken: { clientId: "cid_abc", name: "example-access-dev" },
    ...overrides,
  };
}
