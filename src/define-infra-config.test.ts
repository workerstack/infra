import { expect, expectTypeOf, it } from "vitest";

import { defineInfraConfig } from "./define-infra-config.ts";
import type { ZoneConfigInput } from "./schema/zone.ts";

const ZONE_ID = "0123456789abcdef0123456789abcdef";

function cloudflare(zone: ZoneConfigInput) {
  return {
    accountEmail: "ops@example.com",
    accountId: "fedcba9876543210fedcba9876543210",
    globalApiKey: "key",
    zone,
  };
}

const DEFAULT_ZONE = {
  agentReadiness: { markdownForAgents: true },
  cache: [],
  cloudConnectors: [],
  disabledWorkerRoutes: [],
  dns: { dnssec: false, records: [] },
  domain: "example.com",
  emailRouting: { rules: [] },
  rateLimit: [],
  redirects: { locale: [], rules: [], wwwToRoot: false },
  speed: { earlyHints: true, fonts: true },
  ssl: {
    alwaysHttps: true,
    autoRewrites: true,
    hsts: {
      enabled: true,
      includeSubDomains: true,
      maxAge: 63_072_000,
      nosniff: true,
      preload: false,
    },
    minTls: "1.2",
    tls13: true,
  },
  transforms: { urlRewrites: [] },
  waf: { rules: [], scannerBlock: true },
  zoneId: ZONE_ID,
};

it("fills every zone default for a minimal zone", () => {
  const config = defineInfraConfig({
    cloudflare: cloudflare({ domain: "example.com", zoneId: ZONE_ID }),
  });

  expect(config.cloudflare?.zone).toStrictEqual(DEFAULT_ZONE);
});

it("defaults bindings to an empty record", () => {
  const config = defineInfraConfig({
    cloudflare: cloudflare({ domain: "example.com", zoneId: ZONE_ID }),
  });

  expect(config.cloudflare?.bindings).toStrictEqual({});
});

it("fills nested rule defaults", () => {
  const config = defineInfraConfig({
    cloudflare: cloudflare({
      domain: "example.com",
      rateLimit: [{ description: "login", expression: "true", requestsPerPeriod: 5 }],
      zoneId: ZONE_ID,
    }),
  });

  expect(config.cloudflare?.zone.rateLimit).toStrictEqual([
    {
      description: "login",
      enabled: true,
      expression: "true",
      mitigationTimeout: 10,
      period: 10,
      requestsPerPeriod: 5,
    },
  ]);
});

it("rejects a local host that is not one name under .localhost", () => {
  expect(() => defineInfraConfig({ local: { host: "example.com", vars: () => ({}) } })).toThrow(
    "local.host example.com is not one name under .localhost",
  );
});

it("names the path and reason of a bad zone field", () => {
  expect(() =>
    defineInfraConfig({
      cloudflare: cloudflare({
        domain: "example.com",
        ssl: { hsts: { maxAge: -1 } },
        zoneId: ZONE_ID,
      }),
    }),
  ).toThrow("cloudflare.zone.ssl.hsts.maxAge: Too small: expected number to be >=0");
});

it("keeps binding names in the return type", () => {
  const config = defineInfraConfig({
    cloudflare: {
      ...cloudflare({ domain: "example.com", zoneId: ZONE_ID }),
      bindings: { prod: { kv_namespaces: { CACHE: { id: "abc" } } } },
    },
  });

  const bindings = config.cloudflare?.bindings;

  expectTypeOf(bindings).not.toBeUndefined();
  expect(bindings?.prod.kv_namespaces.CACHE).toStrictEqual({ id: "abc" });
});
