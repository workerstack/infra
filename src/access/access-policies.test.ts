import { describe, expect, it } from "vitest";

import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import type { Call } from "../shared/__fixtures__/fake-client.ts";
import { listAccessPolicies, reconcileAccessPolicies } from "./access-policies.ts";
import type { AccessPoliciesTarget } from "./access-policies.ts";

const ACCOUNT_ID = "acc";
const POLICIES_PATH = `/accounts/${ACCOUNT_ID}/access/apps/app_abc/policies`;

const TARGET: AccessPoliciesTarget = {
  allowEmails: [],
  appId: "app_abc",
  googleIdPId: "idp_123",
  serviceTokenId: "tok_1",
};

function existing(...ids: string[]): ReturnType<typeof fakeClient> {
  return fakeClient(({ method }) => (method === "GET" ? { result: ids.map((id) => ({ id })) } : { id: "p" }));
}

function posts(calls: Call[]): (object | undefined)[] {
  return calls.filter((call) => call.method === "POST").map((call) => call.body);
}

describe("reconcileAccessPolicies", () => {
  it("deletes every existing policy before it creates the fresh ones", async () => {
    const { calls, client } = existing("p1", "p2");

    await reconcileAccessPolicies(client, ACCOUNT_ID, TARGET);

    expect(calls.map((call) => `${call.method} ${call.path}`)).toStrictEqual([
      `GET ${POLICIES_PATH}`,
      `DELETE ${POLICIES_PATH}/p1`,
      `DELETE ${POLICIES_PATH}/p2`,
      `POST ${POLICIES_PATH}`,
    ]);
  });

  it("always creates the service_auth policy for the service token", async () => {
    const { calls, client } = existing();

    await reconcileAccessPolicies(client, ACCOUNT_ID, TARGET);

    expect(posts(calls)).toStrictEqual([
      {
        decision: "service_auth",
        include: [{ service_token: { token_id: "tok_1" } }],
        name: "infra service auth",
      },
    ]);
  });
});

describe("reconcileAccessPolicies (allow policy)", () => {
  it("creates the allow policy second when there are allowed emails", async () => {
    const { calls, client } = existing();

    await reconcileAccessPolicies(client, ACCOUNT_ID, { ...TARGET, allowEmails: ["a@example.com", "b@example.com"] });

    expect(posts(calls)[0]).toMatchObject({ decision: "service_auth" });
    expect(posts(calls)[1]).toStrictEqual({
      decision: "allow",
      include: [{ email: { email: "a@example.com" } }, { email: { email: "b@example.com" } }],
      name: "infra allow emails",
      require: [{ login_method: "idp_123" }],
    });
  });

  it("returns the count of policies created", async () => {
    const without = existing();
    const withEmails = existing();

    expect(await reconcileAccessPolicies(without.client, ACCOUNT_ID, TARGET)).toBe(1);
    expect(
      await reconcileAccessPolicies(withEmails.client, ACCOUNT_ID, { ...TARGET, allowEmails: ["a@example.com"] }),
    ).toBe(2);
  });
});

describe("listAccessPolicies", () => {
  it("returns the policy list", async () => {
    const policies = [{ decision: "service_auth", id: "p1", name: "infra service auth" }];
    const { client } = fakeClient(() => ({ result: policies }));

    expect(await listAccessPolicies(client, ACCOUNT_ID, "app_abc")).toStrictEqual(policies);
  });

  it("returns [] on an error", async () => {
    const { client } = fakeClient(() => {
      throw new Error("CF 404");
    });

    expect(await listAccessPolicies(client, ACCOUNT_ID, "app_abc")).toStrictEqual([]);
  });

  it("returns [] when the app has none", async () => {
    const { client } = fakeClient(() => ({ result: [] }));

    expect(await listAccessPolicies(client, ACCOUNT_ID, "app_abc")).toStrictEqual([]);
  });
});
