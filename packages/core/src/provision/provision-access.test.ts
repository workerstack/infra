import { describe, expect, it } from "vitest";

import { fakeEnv } from "../access/__fixtures__/fake-env.ts";
import type { CloudflareAccessEnv } from "../schema/cloudflare-env.ts";
import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import type { Call } from "../shared/__fixtures__/fake-client.ts";
import { logLines } from "./__fixtures__/log-lines.ts";
import { provisionAccessScope } from "./provision-access-scope.ts";
import { provisionAccess } from "./provision-access.ts";

const A = "/accounts/acc/access";

const APP = {
  allowed_idps: ["idp"],
  aud: "aud",
  id: "app",
  name: "Admin (dev)",
  self_hosted_domains: ["example.com/admin/*"],
  session_duration: "8h",
};

const DEV: CloudflareAccessEnv = {
  applications: {
    admin: { allowEmails: ["owner@example.com"], domain: "example.com", name: "Admin (dev)", paths: ["/admin/*"] },
  },
  google: { clientId: "gid" },
  serviceToken: { clientId: "STUB", name: "example-dev" },
};

const PROD: CloudflareAccessEnv = {
  google: { clientId: "gid" },
  serviceToken: { clientId: "STUB", name: "example-prod" },
};

const IDP_SECRET = { ACCESS_GOOGLE_CLIENT_SECRET: "g" };
const TARGET = { accountId: "acc", env: { ...fakeEnv("dev"), dev: IDP_SECRET, prod: IDP_SECRET } };

type World = { apps?: object[]; policies?: object[]; tokens?: object[] };

function quiet(): void {
  // progress lines are not under test here
}

function nameOf({ body }: Call): string {
  return body !== undefined && "name" in body ? String(body.name) : "x";
}

function world({ apps = [], policies = [], tokens = [] }: World): (call: Call) => object | null {
  return (call) => {
    const named = nameOf(call);
    const idp = { config: { client_id: "gid" }, id: `idp_${named}`, name: named, type: "google" };
    const token = { client_id: `cid_${named}`, client_secret: `sec_${named}`, id: "tok", name: named };

    const routes = new Map<string, object>([
      [`GET ${A}/organizations`, { auth_domain: "team.example.com", name: "team" }],
      [`GET ${A}/identity_providers`, { result: [] }],
      [`POST ${A}/identity_providers`, idp],
      [`GET ${A}/service_tokens`, { result: tokens }],
      [`POST ${A}/service_tokens`, token],
      [`GET ${A}/apps`, { result: apps }],
      [`POST ${A}/apps`, APP],
      [`PUT ${A}/apps/app`, APP],
      [`GET ${A}/apps/app/policies`, { result: policies }],
      [`POST ${A}/apps/app/policies`, { id: "p" }],
    ]);

    const answer = call.method === "DELETE" ? {} : routes.get(`${call.method} ${call.path}`);

    if (answer === undefined) throw new Error(`unexpected: ${call.method} ${call.path}`);

    return answer;
  };
}

describe("provisionAccess", () => {
  it("makes no call for no scopes", async () => {
    const { calls, client } = fakeClient(world({}));

    expect(await provisionAccess(client, { ...TARGET, access: {} }, quiet)).toStrictEqual({ edits: [], secrets: [] });
    expect(calls).toStrictEqual([]);
  });

  it("returns the token id edit and its secret write for a new token", async () => {
    const { client } = fakeClient(world({}));
    const result = await provisionAccess(client, { ...TARGET, access: { dev: DEV } }, quiet);

    expect(result.secrets).toStrictEqual([
      { key: "ACCESS_SERVICE_TOKEN_CLIENT_SECRET", scope: "dev", value: "sec_example-dev" },
    ]);
    expect(result.edits).toHaveLength(1);
    expect(result.edits[0]?.replacement).toContain("cid_example-dev");
  });

  it("logs a line per resource tagged with its scope, and only for the scopes given", async () => {
    const { client } = fakeClient(world({}));
    const { lines, log } = logLines();

    await provisionAccess(client, { ...TARGET, access: { dev: DEV } }, log);

    expect(lines).toContain("  [dev] Access organization ...");
    expect(lines).toContain('  [dev] Access IdP "Google (dev)" ...');
    expect(lines).toContain('  [dev] Access service token "example-dev" ...');
    expect(lines).toContain('  [dev] Access application "Admin (dev)" ...');
    expect(lines.join("\n")).not.toContain("[prod]");
  });
});

describe("provisionAccess with an existing token", () => {
  const tokens = [{ client_id: "cid", id: "tok", name: "example-dev" }];

  it("returns nothing and creates no resource when it has its env secret", async () => {
    const { calls, client } = fakeClient(world({ apps: [APP], tokens }));
    const dev = { ...DEV, serviceToken: { clientId: "cid", name: "example-dev" } };
    const kept = { ...IDP_SECRET, ACCESS_SERVICE_TOKEN_CLIENT_SECRET: "kept" };
    const env = { ...TARGET.env, dev: kept };

    const result = await provisionAccess(client, { access: { dev }, accountId: "acc", env }, quiet);

    expect(result).toStrictEqual({ edits: [], secrets: [] });
    expect(calls.filter((call) => call.method === "POST" && /service_tokens|apps$/.test(call.path))).toStrictEqual([]);
  });

  it("throws the rotate error while the config clientId is STUB, and creates no app", async () => {
    const { calls, client } = fakeClient(world({ tokens }));

    await expect(provisionAccess(client, { ...TARGET, access: { dev: DEV } }, quiet)).rejects.toThrow("To rotate");
    expect(calls.some((call) => call.path.endsWith("/apps"))).toBe(false);
  });
});

describe("provisionAccess across scopes", () => {
  it("fails on a missing Zero Trust organization before it touches an IdP", async () => {
    const { calls, client } = fakeClient(() => {
      throw new Error("CF API GET: not_found");
    });

    await expect(provisionAccess(client, { ...TARGET, access: { dev: DEV } }, quiet)).rejects.toThrow(
      "Zero Trust not enabled",
    );
    expect(calls).toHaveLength(1);
  });

  it("provisions each scope on its own, with edits and secrets that name its own token", async () => {
    const { calls, client } = fakeClient(world({}));

    const { edits, secrets } = await provisionAccess(client, { ...TARGET, access: { dev: DEV, prod: PROD } }, quiet);
    const idps = calls.filter((call) => call.method === "POST" && call.path.endsWith("/identity_providers"));

    expect(idps.map(nameOf)).toStrictEqual(["Google (dev)", "Google (prod)"]);
    expect(secrets.map((secret) => secret.scope)).toStrictEqual(["dev", "prod"]);
    expect(edits.map((edit) => String(edit.pattern))).toStrictEqual([
      expect.stringContaining("example-dev"),
      expect.stringContaining("example-prod"),
    ]);
  });
});

describe("provisionAccessScope", () => {
  it("syncs an app that drifted, and replaces its policies every time", async () => {
    const stale = { ...APP, self_hosted_domains: ["example.com/old/*"] };
    const { calls, client } = fakeClient(world({ apps: [stale], policies: [{ id: "p1" }, { id: "p2" }] }));

    await provisionAccessScope(client, { ...TARGET, config: DEV, scope: "dev" }, quiet);

    const methods = calls.map((call) => call.method);

    expect(methods.filter((method) => method === "PUT")).toHaveLength(1);
    expect(methods.filter((method) => method === "DELETE")).toHaveLength(2);
    expect(calls.filter((call) => call.method === "POST" && call.path.endsWith("/policies"))).toHaveLength(2);
  });
});
