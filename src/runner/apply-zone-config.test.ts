import { expect, it } from "vitest";

import { logLines } from "../provision/__fixtures__/log-lines.ts";
import { fakeClient, writes } from "../shared/__fixtures__/fake-client.ts";
import { applyAnswer } from "./__fixtures__/apply-answer.ts";
import { zoneConfig } from "./__fixtures__/zone-config.ts";
import { applyZoneConfig } from "./apply-zone-config.ts";

const STEPS = [
  "WAF",
  "Rate limits",
  "Transforms",
  "Cloud Connector",
  "Worker routes (disabled)",
  "SSL/TLS",
  "Speed",
  "Agent-readiness",
  "Cache",
  "Email Routing",
  "DNS records",
];

it("applyZoneConfig PATCHes security_header exactly once with the nested object payload", async () => {
  const { calls, client } = fakeClient(applyAnswer());
  const { log } = logLines();

  await applyZoneConfig(client, zoneConfig(), { log });

  const header = calls.filter((call) => call.method === "PATCH" && call.path === "/zones/zid/settings/security_header");

  expect(header).toHaveLength(1);

  expect(header[0]?.body).toStrictEqual({
    value: {
      strict_transport_security: {
        enabled: true,
        include_subdomains: true,
        max_age: 63072000,
        nosniff: true,
        preload: false,
      },
    },
  });
});

it("applyZoneConfig prints each step as '  <label> ...' then '    → done', in order", async () => {
  const { client } = fakeClient(applyAnswer());
  const { lines, log } = logLines();

  await applyZoneConfig(client, zoneConfig(), { log });

  const heads = lines.filter((line) => line.endsWith(" ..."));

  expect(heads).toStrictEqual(STEPS.map((label) => `  ${label} ...`));
  expect(lines.filter((line) => line === "    → done")).toHaveLength(STEPS.length - 1);
});

it("applyZoneConfig does not write the redirect ruleset", async () => {
  const { calls, client } = fakeClient(applyAnswer());
  const { log } = logLines();

  await applyZoneConfig(client, zoneConfig(), { log });

  const bodies = writes(calls).map((call) => JSON.stringify(call.body));

  expect(bodies.some((body) => body.includes("http_request_dynamic_redirect"))).toBe(false);
});
