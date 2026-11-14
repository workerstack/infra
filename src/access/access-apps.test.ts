import { describe, expect, it } from "vitest";

import type { CloudflareAccessApplication } from "../schema/cloudflare-env.ts";
import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import type { Call } from "../shared/__fixtures__/fake-client.ts";
import { findOrCreateAccessApplication, getAccessApplication } from "./access-apps.ts";

const ACCOUNT_ID = "acc";
const APPS_PATH = `/accounts/${ACCOUNT_ID}/access/apps`;
const IDP_ID = "idp_123";

const BASE: CloudflareAccessApplication = {
  allowEmails: ["owner@example.com"],
  domain: "example.com",
  name: "Example Admin (dev)",
  paths: ["/v1/admin/*"],
};

function app(id: string, name: string) {
  return {
    allowed_idps: [IDP_ID],
    aud: "aud_1",
    id,
    name,
    self_hosted_domains: [],
    session_duration: "8h",
  };
}

function empty(): ReturnType<typeof fakeClient> {
  return fakeClient(({ method }) => (method === "GET" ? { result: [] } : app("app_new", BASE.name)));
}

function posted(calls: Call[]): object | undefined {
  return calls.find((call) => call.method === "POST")?.body;
}

describe("findOrCreateAccessApplication", () => {
  it("creates the app when none match by name", async () => {
    const created = app("app_new", BASE.name);
    const { calls, client } = fakeClient(({ method }) => (method === "GET" ? { result: [] } : created));

    expect(
      await findOrCreateAccessApplication(client, ACCOUNT_ID, { config: BASE, googleIdPId: IDP_ID }),
    ).toStrictEqual(created);
    expect(posted(calls)).toStrictEqual({
      allowed_idps: [IDP_ID],
      app_launcher_visible: false,
      name: BASE.name,
      self_hosted_domains: ["example.com/v1/admin/*"],
      session_duration: "8h",
      type: "self_hosted",
    });
  });
});

describe("findOrCreateAccessApplication (request body)", () => {
  it("uses a custom sessionDurationHours", async () => {
    const { calls, client } = empty();

    await findOrCreateAccessApplication(client, ACCOUNT_ID, {
      config: { ...BASE, sessionDurationHours: 24 },
      googleIdPId: IDP_ID,
    });

    expect(posted(calls)).toMatchObject({ session_duration: "24h" });
  });

  it("builds self_hosted_domains from the domain and each path", async () => {
    const { calls, client } = empty();

    await findOrCreateAccessApplication(client, ACCOUNT_ID, {
      config: { ...BASE, paths: ["/a/*", "/b/*"] },
      googleIdPId: IDP_ID,
    });

    expect(posted(calls)).toMatchObject({ self_hosted_domains: ["example.com/a/*", "example.com/b/*"] });
  });
});

describe("findOrCreateAccessApplication (drift)", () => {
  it("updates an existing app by name on drift", async () => {
    const stale = { ...app("app_9", BASE.name), allowed_idps: ["idp_other"], session_duration: "1h" };
    const { calls, client } = fakeClient(({ method }) => (method === "GET" ? { result: [stale] } : stale));

    await findOrCreateAccessApplication(client, ACCOUNT_ID, { config: BASE, googleIdPId: IDP_ID });

    expect(calls.map((call) => `${call.method} ${call.path}`)).toStrictEqual([
      `GET ${APPS_PATH}`,
      `PUT ${APPS_PATH}/app_9`,
    ]);
    expect(calls[1]?.body).toMatchObject({ allowed_idps: [IDP_ID], session_duration: "8h" });
  });

  it("ignores apps with other names", async () => {
    const { calls, client } = fakeClient(({ method }) =>
      method === "GET" ? { result: [app("app_other", "Other")] } : app("app_new", BASE.name),
    );

    await findOrCreateAccessApplication(client, ACCOUNT_ID, { config: BASE, googleIdPId: IDP_ID });

    expect(calls.map((call) => call.method)).toStrictEqual(["GET", "POST"]);
  });
});

describe("getAccessApplication", () => {
  it("returns the app matching the name", async () => {
    const found = app("app_123", BASE.name);
    const { client } = fakeClient(() => ({ result: [found] }));

    expect(await getAccessApplication(client, ACCOUNT_ID, BASE.name)).toStrictEqual(found);
  });

  it("handles a bare array response", async () => {
    const found = app("app_1", "MyApp");
    const { client } = fakeClient(() => [found]);

    expect(await getAccessApplication(client, ACCOUNT_ID, "MyApp")).toStrictEqual(found);
  });

  it("returns undefined when not found", async () => {
    const { client } = fakeClient(() => ({ result: [] }));

    expect(await getAccessApplication(client, ACCOUNT_ID, "Missing")).toBeUndefined();
  });
});
