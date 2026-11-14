import { describe, expect, it } from "vitest";

import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { fakeEnv } from "./__fixtures__/fake-env.ts";
import { findOrCreateGoogleIdP, getGoogleIdP } from "./access-idp.ts";
import type { GoogleIdPTarget } from "./access-idp.ts";

const ACCOUNT_ID = "acc";
const IDP_PATH = `/accounts/${ACCOUNT_ID}/access/identity_providers`;

const TARGET: GoogleIdPTarget = {
  config: { clientId: "gid_123" },
  env: fakeEnv("dev", { ACCESS_GOOGLE_CLIENT_SECRET: "gsec_abc" }),
  scope: "dev",
};

function idp(id: string, name: string) {
  return { config: { client_id: "x" }, id, name, type: "google" };
}

describe("findOrCreateGoogleIdP", () => {
  it("creates the IdP when none match by name, with the secret from the scope env", async () => {
    const created = idp("idp_new", "Google (dev)");
    const { calls, client } = fakeClient(({ method }) => (method === "GET" ? { result: [] } : created));

    expect(await findOrCreateGoogleIdP(client, ACCOUNT_ID, TARGET)).toStrictEqual(created);
    expect(calls.map((call) => `${call.method} ${call.path}`)).toStrictEqual([`GET ${IDP_PATH}`, `POST ${IDP_PATH}`]);
    expect(calls[1]?.body).toStrictEqual({
      config: { client_id: "gid_123", client_secret: "gsec_abc" },
      name: "Google (dev)",
      type: "google",
    });
  });

  it("updates an existing IdP by exact name (drift)", async () => {
    const { calls, client } = fakeClient(({ method }) =>
      method === "GET" ? { result: [idp("idp_123", "Google (dev)")] } : idp("idp_123", "Google (dev)"),
    );

    await findOrCreateGoogleIdP(client, ACCOUNT_ID, TARGET);

    expect(calls.map((call) => `${call.method} ${call.path}`)).toStrictEqual([
      `GET ${IDP_PATH}`,
      `PUT ${IDP_PATH}/idp_123`,
    ]);
  });
});

describe("findOrCreateGoogleIdP (matching and secret)", () => {
  it("ignores IdPs with other names even if the type is google", async () => {
    const { calls, client } = fakeClient(({ method }) =>
      method === "GET" ? { result: [idp("idp_x", "Google (prod)")] } : idp("idp_new", "Google (dev)"),
    );

    await findOrCreateGoogleIdP(client, ACCOUNT_ID, TARGET);

    expect(calls.map((call) => call.method)).toStrictEqual(["GET", "POST"]);
  });

  it("throws the fix line, before any request, when the scope has no secret", async () => {
    const { calls, client } = fakeClient(() => ({ result: [] }));

    await expect(findOrCreateGoogleIdP(client, ACCOUNT_ID, { ...TARGET, env: fakeEnv("dev") })).rejects.toThrow(
      "ACCESS_GOOGLE_CLIENT_SECRET has no dev value; run bun repo env set ACCESS_GOOGLE_CLIENT_SECRET --scope dev",
    );
    expect(calls).toStrictEqual([]);
  });
});

describe("getGoogleIdP", () => {
  it("returns the IdP named for the scope", async () => {
    const dev = idp("idp_abc", "Google (dev)");
    const { client } = fakeClient(() => ({ result: [idp("idp_x", "Google (prod)"), dev] }));

    expect(await getGoogleIdP(client, ACCOUNT_ID, "dev")).toStrictEqual(dev);
  });

  it("returns undefined when the name is not in the list or the list is empty", async () => {
    const other = fakeClient(() => ({ result: [idp("idp_x", "Google (prod)")] }));
    const empty = fakeClient(() => ({ result: [] }));

    expect(await getGoogleIdP(other.client, ACCOUNT_ID, "dev")).toBeUndefined();
    expect(await getGoogleIdP(empty.client, ACCOUNT_ID, "dev")).toBeUndefined();
  });
});
