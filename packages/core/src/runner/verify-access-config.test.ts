import { expect, it } from "vitest";

import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { GOOGLE_IDP, SERVICE_TOKEN, accessAnswer } from "./__fixtures__/access-answer.ts";
import type { AccessLive } from "./__fixtures__/access-answer.ts";
import { accessEnv } from "./__fixtures__/access-config.ts";
import { verifyAccessConfig } from "./verify-access-config.ts";

async function verify(live: AccessLive, config = accessEnv()): ReturnType<typeof verifyAccessConfig> {
  const { client } = fakeClient(accessAnswer(live));

  return await verifyAccessConfig(client, "acc", { dev: config });
}

it("verifyAccessConfig returns an empty array when the access map is empty", async () => {
  const { client } = fakeClient(accessAnswer());

  expect(await verifyAccessConfig(client, "acc", {})).toStrictEqual([]);
});

it("verifyAccessConfig reports the organization missing when its GET fails", async () => {
  const result = await verify({ orgThrows: true });

  expect(result[0]?.organization.exists).toBe(false);
  expect(result[0]?.organization.authDomain).toBeUndefined();
});

it("verifyAccessConfig reports the IdP missing when its name is not found", async () => {
  const result = await verify({ idps: [] });

  expect(result[0]?.googleIdp.exists).toBe(false);
});

it("verifyAccessConfig reports an IdP clientId mismatch", async () => {
  const result = await verify({ idps: [{ ...GOOGLE_IDP, config: { client_id: "wrong_id" } }] });

  expect(result[0]?.googleIdp.exists).toBe(true);
  expect(result[0]?.googleIdp.clientIdMatches).toBe(false);
});

it("verifyAccessConfig reports the service token missing when its name is not found", async () => {
  const result = await verify({ tokens: [] });

  expect(result[0]?.serviceToken.exists).toBe(false);
});

it("verifyAccessConfig reports a STUB clientId in config while Cloudflare has the token", async () => {
  const result = await verify({}, accessEnv({ serviceToken: { clientId: "STUB", name: "example-access-dev" } }));

  expect(result[0]?.serviceToken.configHasStub).toBe(true);
  expect(result[0]?.serviceToken.exists).toBe(true);
});

it("verifyAccessConfig reports a service token clientId mismatch", async () => {
  const result = await verify({ tokens: [{ ...SERVICE_TOKEN, client_id: "different_cid" }] });

  expect(result[0]?.serviceToken.exists).toBe(true);
  expect(result[0]?.serviceToken.clientIdMatches).toBe(false);
});

it("verifyAccessConfig has no drift on the happy path", async () => {
  const results = await verify({});
  const env = results[0];

  expect(env?.organization.exists).toBe(true);
  expect(env?.googleIdp.clientIdMatches).toBe(true);
  expect(env?.serviceToken.clientIdMatches).toBe(true);
  expect(env?.serviceToken.configHasStub).toBe(false);
  expect(env?.applications[0]?.exists).toBe(true);
  expect(env?.applications[0]?.drift).toStrictEqual([]);
});

it("verifyAccessConfig processes each scope independently, tagged with the scope", async () => {
  const { client } = fakeClient(accessAnswer({ apps: [], idps: [], tokens: [] }));

  const result = await verifyAccessConfig(client, "acc", { dev: accessEnv(), prod: accessEnv() });

  expect(result.map((entry) => entry.env)).toStrictEqual(["dev", "prod"]);
});
