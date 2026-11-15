import { expect, it } from "vitest";

import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { zoneAnswer } from "./__fixtures__/zone-answer.ts";
import type { ZoneLive } from "./__fixtures__/zone-answer.ts";
import { zoneConfig } from "./__fixtures__/zone-config.ts";
import { verifyZoneConfig } from "./verify-zone-config.ts";

const HSTS_OFF = {
  strict_transport_security: { enabled: false, include_subdomains: false, max_age: 0, nosniff: false, preload: false },
};

const REWRITE_RULE = {
  action: "rewrite",
  action_parameters: { uri: { path: { expression: "X" } } },
  description: "d1",
  enabled: true,
  expression: "E1",
};

const CONNECTOR = {
  description: "cc1",
  enabled: true,
  expression: "E2",
  parameters: { host: "h1" },
  provider: "cloudflare_r2",
};

const IN_SYNC = { declared: 1, extra: [], live: 1, missing: [] };

async function verify(live: ZoneLive = {}): ReturnType<typeof verifyZoneConfig> {
  const { client } = fakeClient(zoneAnswer(live));

  return await verifyZoneConfig(client, zoneConfig());
}

it("verifyZoneConfig fetches the 6 scalar settings and security_header, and never http2", async () => {
  const { calls, client } = fakeClient(zoneAnswer());

  await verifyZoneConfig(client, zoneConfig());

  const settings = calls.filter((call) => call.path.includes("/settings/"));
  const keys = settings.map((call) => call.path.split("/settings/")[1] ?? "");

  expect(keys.toSorted((left, right) => left.localeCompare(right))).toStrictEqual([
    "always_use_https",
    "automatic_https_rewrites",
    "early_hints",
    "fonts",
    "min_tls_version",
    "security_header",
    "tls_1_3",
  ]);
});

it("verifyZoneConfig returns hsts live state parsed from security_header", async () => {
  const result = await verify();

  expect(result.hsts).toStrictEqual({
    enabled: true,
    includeSubDomains: true,
    maxAge: 63072000,
    nosniff: true,
    preload: true,
  });
});

it("verifyZoneConfig reflects hsts disabled state", async () => {
  const result = await verify({ hsts: HSTS_OFF, setting: "off" });

  expect(result.hsts).toStrictEqual({
    enabled: false,
    includeSubDomains: false,
    maxAge: 0,
    nosniff: false,
    preload: false,
  });

  expect(result.settings.tls_1_3).toBe("off");
});

it("verifyZoneConfig returns drift-split transforms, cloudConnectors, disabledWorkerRoutes", async () => {
  const live = {
    connectors: [CONNECTOR],
    routes: [{ id: "rt1", pattern: "example.com/p1", script: null }],
    rulesets: { http_request_transform: [REWRITE_RULE] },
  };

  const { client } = fakeClient(zoneAnswer(live));

  const config = zoneConfig({
    cloudConnectors: [{ description: "cc1", expression: "E2", host: "h1" }],
    disabledWorkerRoutes: ["example.com/p1"],
    transforms: { urlRewrites: [{ description: "d1", expression: "E1", pathExpression: "X" }] },
  });

  const result = await verifyZoneConfig(client, config);

  expect(result.transforms).toStrictEqual(IN_SYNC);
  expect(result.cloudConnectors).toStrictEqual(IN_SYNC);
  expect(result.disabledWorkerRoutes).toStrictEqual(IN_SYNC);
});
