import { expect, it } from "vitest";

import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { ACCESS_APP, accessAnswer } from "./__fixtures__/access-answer.ts";
import type { AccessLive } from "./__fixtures__/access-answer.ts";
import { ADMIN_APP, accessEnv } from "./__fixtures__/access-config.ts";
import { verifyAccessConfig } from "./verify-access-config.ts";

const ONE_POLICY = [{ decision: "service_auth", id: "p1", name: "service auth" }];

async function drift(live: AccessLive, allowEmails = ADMIN_APP.allowEmails): Promise<string[] | undefined> {
  const { client } = fakeClient(accessAnswer(live));
  const config = accessEnv({ applications: { ADMIN: { ...ADMIN_APP, allowEmails } } });

  const result = await verifyAccessConfig(client, "acc", { dev: config });

  return result[0]?.applications[0]?.drift;
}

it("verifyAccessConfig reports an application missing", async () => {
  const { client } = fakeClient(accessAnswer({ apps: [] }));

  const result = await verifyAccessConfig(client, "acc", { dev: accessEnv() });

  expect(result[0]?.applications[0]?.exists).toBe(false);
});

it("verifyAccessConfig reports application paths drift", async () => {
  const live = { apps: [{ ...ACCESS_APP, self_hosted_domains: ["example.com/old-path/*"] }] };

  expect(await drift(live)).toContain("paths");
});

it("verifyAccessConfig reports application session drift", async () => {
  expect(await drift({ apps: [{ ...ACCESS_APP, session_duration: "24h" }] })).toContain("session");
});

it("verifyAccessConfig reports application allowed_idps drift", async () => {
  expect(await drift({ apps: [{ ...ACCESS_APP, allowed_idps: ["idp_other"] }] })).toContain("allowed_idps");
});

it("verifyAccessConfig reports policy drift when allowEmails is empty but Cloudflare has 2 policies", async () => {
  expect(await drift({}, [])).toContain("policies");
});

it("verifyAccessConfig reports policy drift when allowEmails is set but Cloudflare has 1 policy", async () => {
  expect(await drift({ policies: ONE_POLICY })).toContain("policies");
});

it("verifyAccessConfig accepts one policy when allowEmails is empty", async () => {
  expect(await drift({ policies: ONE_POLICY }, [])).toStrictEqual([]);
});
