import { describe, expect, it } from "vitest";

import { fakeEnv } from "../access/__fixtures__/fake-env.ts";
import type { CloudflareAccessEnv, CloudflareTurnstileEnv } from "../schema/cloudflare-env.ts";
import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import type { Call } from "../shared/__fixtures__/fake-client.ts";
import { provisionAccess } from "./provision-access.ts";
import { provisionBindings } from "./provision-bindings.ts";

const ACCOUNT_ID = "acc";
const SECRET = "shh-once";

const TURNSTILE: CloudflareTurnstileEnv = {
  domains: ["example.com"],
  mode: "managed",
  name: "example-widget",
  siteKey: "STUB",
};

const IDP = { config: { client_id: "gid" }, id: "idp", name: "Google (prod)", type: "google" };
const TOKEN = { client_id: "cid_new", client_secret: SECRET, id: "tok", name: "example-prod" };

const ACCESS: CloudflareAccessEnv = {
  google: { clientId: "gid" },
  serviceToken: { clientId: "STUB", name: "example-prod" },
};

function quiet(): void {
  // progress lines are not under test here
}

function answer({ method, path }: Call): object | null {
  if (method === "GET" && path.endsWith("/access/organizations")) return { auth_domain: "team.example.com", name: "t" };

  if (method === "GET") return { result: [] };

  if (path.endsWith("/challenges/widgets")) return { ...TURNSTILE, secret: SECRET, sitekey: "0xKEY" };

  if (path.endsWith("/identity_providers")) return IDP;

  return path.endsWith("/service_tokens") ? TOKEN : {};
}

describe("provisioning with no secret in the env", () => {
  it("returns a new Turnstile secret as a SecretWrite and no edit holding it", async () => {
    const { client } = fakeClient(answer);

    const target = {
      accountId: ACCOUNT_ID,
      bindings: {},
      env: fakeEnv("prod"),
      turnstile: { prod: TURNSTILE },
      zoneId: "z",
    };

    const { edits, secrets } = await provisionBindings(client, target, quiet);
    const text = edits.map((edit) => edit.replacement);

    expect(secrets).toStrictEqual([{ key: "TURNSTILE_SECRET_KEY", scope: "prod", value: SECRET }]);
    expect(text).toStrictEqual(['siteKey: "0xKEY",']);
  });

  it("returns a new Access service token secret as a SecretWrite and no edit holding it", async () => {
    const { client } = fakeClient(answer);
    const env = fakeEnv("prod", { ACCESS_GOOGLE_CLIENT_SECRET: "gsec" });

    const { edits, secrets } = await provisionAccess(
      client,
      { access: { prod: ACCESS }, accountId: ACCOUNT_ID, env },
      quiet,
    );

    const text = edits.map((edit) => edit.replacement).join("\n");

    expect(secrets).toStrictEqual([{ key: "ACCESS_SERVICE_TOKEN_CLIENT_SECRET", scope: "prod", value: SECRET }]);
    expect(text).toContain("cid_new");
    expect(text).not.toContain(SECRET);
  });
});
