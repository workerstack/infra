import { expect, it } from "vitest";

import { logLines } from "../provision/__fixtures__/log-lines.ts";
import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { cloudflareConfig } from "./__fixtures__/cloudflare-config.ts";
import { flowAnswer } from "./__fixtures__/flow-answer.ts";
import { globalEnv } from "./__fixtures__/global-env.ts";
import { getCloudflare } from "./get-cloudflare.ts";

const ENV = globalEnv({});

it("getCloudflare prints the heading, zone rules, settings, DNS, bindings and R2 sections in order", async () => {
  const { client } = fakeClient(flowAnswer());
  const { lines, log } = logLines();

  await getCloudflare(client, { accountId: "acc", config: cloudflareConfig(), env: ENV, name: "apps/web" }, log);

  expect(lines.filter((line) => !line.startsWith("    "))).toStrictEqual([
    "\n Cloudflare: apps/web (example.com) [zid]",
    "  WAF Custom Rules: (none)",
    "  Rate Limiting: (none)",
    "  Redirect Rules: (none)",
    "  Cache Rules: (none)",
    "  Settings:",
    "  DNS Records:",
    "  Bindings (verified):",
    "  R2 Buckets:",
  ]);
});

it("getCloudflare adds the R2 credentials line, the Turnstile and the Access sections when declared", async () => {
  const { client } = fakeClient(flowAnswer());
  const { lines, log } = logLines();

  const config = cloudflareConfig({
    access: {},
    r2: { accessKeyId: "key", endpoint: "https://abc.r2.cloudflarestorage.com" },
    turnstile: {},
  });

  await getCloudflare(client, { accountId: "acc", config, env: ENV, name: "apps/web" }, log);

  expect(lines).toContain("  R2 Credentials: keys ✗ missing, endpoint ✓");
  expect(lines).toContain("  Turnstile:");
  expect(lines).toContain("    (no provisioned widgets)");
});
