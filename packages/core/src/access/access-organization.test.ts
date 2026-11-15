import { describe, expect, it } from "vitest";

import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { findOrCreateAccessOrganization, getAccessOrganization } from "./access-organization.ts";

const ACCOUNT_ID = "acc";
const ORG_PATH = `/accounts/${ACCOUNT_ID}/access/organizations`;
const ORG = { auth_domain: "foo.cloudflareaccess.com", name: "foo" };

function failing(): never {
  throw new Error(`CF API GET ${ORG_PATH}: not_found`);
}

describe("findOrCreateAccessOrganization", () => {
  it("returns the team domain when Zero Trust is enabled", async () => {
    const { calls, client } = fakeClient(() => ORG);

    expect(await findOrCreateAccessOrganization(client, ACCOUNT_ID)).toStrictEqual(ORG);
    expect(calls).toStrictEqual([{ body: undefined, method: "GET", path: ORG_PATH }]);
  });

  it("throws the guidance when CF returns a not_found error", async () => {
    const { client } = fakeClient(failing);

    await expect(findOrCreateAccessOrganization(client, ACCOUNT_ID)).rejects.toThrow("Zero Trust not enabled");
    await expect(findOrCreateAccessOrganization(client, ACCOUNT_ID)).rejects.toThrow("Enable once in CF dashboard");
  });

  it("throws the guidance when the result is null", async () => {
    const { client } = fakeClient(() => null);

    await expect(findOrCreateAccessOrganization(client, ACCOUNT_ID)).rejects.toThrow("Zero Trust not enabled");
    await expect(findOrCreateAccessOrganization(client, ACCOUNT_ID)).rejects.toThrow("Enable once in CF dashboard");
  });
});

describe("getAccessOrganization", () => {
  it("returns the org when present", async () => {
    const { client } = fakeClient(() => ORG);

    expect(await getAccessOrganization(client, ACCOUNT_ID)).toStrictEqual(ORG);
  });

  it("returns undefined when CF errors", async () => {
    const { client } = fakeClient(failing);

    expect(await getAccessOrganization(client, ACCOUNT_ID)).toBeUndefined();
  });

  it("returns undefined when the result is null", async () => {
    const { client } = fakeClient(() => null);

    expect(await getAccessOrganization(client, ACCOUNT_ID)).toBeUndefined();
  });
});
