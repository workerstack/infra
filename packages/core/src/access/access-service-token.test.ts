import { describe, expect, it } from "vitest";

import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { fakeEnv } from "./__fixtures__/fake-env.ts";
import { findOrCreateAccessServiceToken, getAccessServiceToken } from "./access-service-token.ts";
import type { AccessServiceTokenTarget } from "./access-service-token.ts";

const ACCOUNT_ID = "acc";
const TOKENS_PATH = `/accounts/${ACCOUNT_ID}/access/service_tokens`;
const NAME = "example-prod";
const EXISTING = { client_id: "cid_1", id: "tok_1", name: NAME };
const WITH_SECRET = fakeEnv("prod", { ACCESS_SERVICE_TOKEN_CLIENT_SECRET: "csec_real" });

function target(clientId: string, env = WITH_SECRET): AccessServiceTokenTarget {
  return { config: { clientId, name: NAME }, env, scope: "prod" };
}

const ROTATE_ERROR =
  `Service token "${NAME}" already exists on CF but ACCESS_SERVICE_TOKEN_CLIENT_SECRET has no prod value.\n` +
  `CF does not expose service token secrets after creation.\n` +
  `To rotate: 1) delete "${NAME}" in CF dashboard → Zero Trust → Access → Service Auth\n` +
  `          2) keep clientId as "STUB" in config\n` +
  `          3) re-run the provisioner to create a fresh token and write its secret to the env`;

describe("findOrCreateAccessServiceToken", () => {
  it("creates a missing token and returns the client_id and client_secret CF shows once", async () => {
    const created = { client_id: "cid_new", client_secret: "shh-once", id: "tok_new", name: NAME };
    const { calls, client } = fakeClient(({ method }) => (method === "GET" ? { result: [] } : created));

    const result = await findOrCreateAccessServiceToken(client, ACCOUNT_ID, target("STUB", fakeEnv("prod")));

    expect(result).toMatchObject({ client_id: "cid_new", client_secret: "shh-once" });
    expect(calls[1]).toStrictEqual({ body: { duration: "8760h", name: NAME }, method: "POST", path: TOKENS_PATH });
  });

  it("keeps an existing token with a real clientId and an env secret, with no secret returned", async () => {
    const { calls, client } = fakeClient(() => ({ result: [EXISTING] }));

    const result = await findOrCreateAccessServiceToken(client, ACCOUNT_ID, target("cid_1"));

    expect(result).toStrictEqual({ client_id: "cid_1", client_secret: undefined, id: "tok_1", name: NAME });
    expect(calls.map((call) => call.method)).toStrictEqual(["GET"]);
  });

  it("throws the rotate error when the token exists and the config clientId is STUB", async () => {
    const { client } = fakeClient(() => ({ result: [EXISTING] }));

    await expect(findOrCreateAccessServiceToken(client, ACCOUNT_ID, target("STUB"))).rejects.toThrow(ROTATE_ERROR);
  });
});

describe("findOrCreateAccessServiceToken (rotate error)", () => {
  it("throws the rotate error when the token exists and the scope has no env secret", async () => {
    const { client } = fakeClient(() => ({ result: [EXISTING] }));

    await expect(findOrCreateAccessServiceToken(client, ACCOUNT_ID, target("cid_1", fakeEnv("prod")))).rejects.toThrow(
      ROTATE_ERROR,
    );
  });

  it("treats an empty env secret as missing", async () => {
    const { client } = fakeClient(() => ({ result: [EXISTING] }));
    const env = fakeEnv("prod", { ACCESS_SERVICE_TOKEN_CLIENT_SECRET: "" });

    await expect(findOrCreateAccessServiceToken(client, ACCOUNT_ID, target("cid_1", env))).rejects.toThrow(
      "has no prod value",
    );
  });

  it("names the scope in the error", async () => {
    const { client } = fakeClient(() => ({ result: [EXISTING] }));
    const dev: AccessServiceTokenTarget = { ...target("STUB"), scope: "dev" };

    await expect(findOrCreateAccessServiceToken(client, ACCOUNT_ID, dev)).rejects.toThrow("has no dev value");
  });
});

describe("getAccessServiceToken", () => {
  it("returns the token matching the name", async () => {
    const { client } = fakeClient(() => ({ result: [EXISTING] }));

    expect(await getAccessServiceToken(client, ACCOUNT_ID, NAME)).toMatchObject(EXISTING);
  });

  it("returns undefined when the name is missing", async () => {
    const { client } = fakeClient(() => ({ result: [] }));

    expect(await getAccessServiceToken(client, ACCOUNT_ID, NAME)).toBeUndefined();
  });

  it("strips the client_secret even if CF returned it", async () => {
    const { client } = fakeClient(() => ({ result: [{ ...EXISTING, client_secret: "shh" }] }));
    const token = await getAccessServiceToken(client, ACCOUNT_ID, NAME);

    expect(token?.client_secret).toBeUndefined();
  });

  it("returns undefined when CF errors", async () => {
    const { client } = fakeClient(() => {
      throw new Error("CF 500");
    });

    expect(await getAccessServiceToken(client, ACCOUNT_ID, NAME)).toBeUndefined();
  });
});
