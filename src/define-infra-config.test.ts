import { defineEnv } from "@workerstack/repo/env";
import { expect, expectTypeOf, it } from "vitest";

import { defineInfraConfig } from "./define-infra-config.ts";
import type { InfraEnv } from "./schema/infra.ts";
import type { ZoneConfigInput } from "./schema/zone.ts";
import { fakeInfraEnv } from "./shared/__fixtures__/fake-infra-env.ts";

const env = fakeInfraEnv();

const ZONE_ID = "0123456789abcdef0123456789abcdef";

function cloudflare(zone: ZoneConfigInput) {
  return { zone };
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
    env,
  });

  expect(config.cloudflare?.zone).toStrictEqual(DEFAULT_ZONE);
});

it("defaults bindings to an empty record", () => {
  const config = defineInfraConfig({
    cloudflare: cloudflare({ domain: "example.com", zoneId: ZONE_ID }),
    env,
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
    env,
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
  expect(() => defineInfraConfig({ env, local: { host: "example.com", vars: () => ({}) } })).toThrow(
    "local.host example.com is not one name under .localhost",
  );
});

function withApps(apps: string[]) {
  return () => defineInfraConfig({ env, local: { apps, host: "example.localhost", vars: () => ({}) } });
}

it("keeps local.apps and rejects an empty, absolute, outside or repeated dir", () => {
  expect(withApps(["web", "apps/site"])().local?.apps).toStrictEqual(["web", "apps/site"]);
  expect(withApps([""])).toThrow("local.apps has an empty dir");
  expect(withApps(["/web"])).toThrow("local.apps dir /web is absolute; name it relative to the product root");
  expect(withApps(["../web"])).toThrow("local.apps dir ../web leaves the product root");
  expect(withApps(["web", "web"])).toThrow("local.apps names web twice");
});

it("names the path and reason of a bad zone field", () => {
  expect(() =>
    defineInfraConfig({
      cloudflare: cloudflare({
        domain: "example.com",
        ssl: { hsts: { maxAge: -1 } },
        zoneId: ZONE_ID,
      }),
      env,
    }),
  ).toThrow("cloudflare.zone.ssl.hsts.maxAge: Too small: expected number to be >=0");
});

it("keeps binding names in the return type", () => {
  const config = defineInfraConfig({
    cloudflare: {
      ...cloudflare({ domain: "example.com", zoneId: ZONE_ID }),
      bindings: { prod: { kv_namespaces: { CACHE: { id: "abc" } } } },
    },
    env,
  });

  const bindings = config.cloudflare?.bindings;

  expectTypeOf(bindings).not.toBeUndefined();
  expect(bindings?.prod.kv_namespaces.CACHE).toStrictEqual({ id: "abc" });
});

it("keeps env as the same object", () => {
  const config = defineInfraConfig({ env });

  expect(config.env).toBe(env);
});

it("defines without reading an env value", () => {
  const throwing: InfraEnv = {
    dev: {},
    get global(): InfraEnv["global"] {
      throw new Error("read");
    },
    local: {},
    prod: {},
    sealedKeys: () => new Set(),
  };

  expect(defineInfraConfig({ env: throwing }).env).toBe(throwing);
});

it("takes a real defineEnv instance as env", () => {
  const real = defineEnv({ dev: {}, global: { CLOUDFLARE_ACCOUNT_ID: "abc" }, local: {}, prod: {} });

  expectTypeOf(real).toExtend<InfraEnv>();
  expect(defineInfraConfig({ env: real }).env).toBe(real);
});

it("rejects a removed credential field", () => {
  expect(() =>
    defineInfraConfig({
      cloudflare: {
        // @ts-expect-error globalApiKey left the schema; it lives in env.global
        globalApiKey: "key",
        zone: { domain: "example.com", zoneId: ZONE_ID },
      },
      env,
    }),
  ).not.toThrow();
});

it("keeps the env type so a kit can check key names", () => {
  const real = defineEnv({ dev: {}, global: {}, local: { GREETING: "hi" }, prod: {} });
  const config = defineInfraConfig({ env: real });

  expectTypeOf(config.env).toEqualTypeOf<typeof real>();
  expectTypeOf(config.env.local).toHaveProperty("GREETING");
  // @ts-expect-error NOPE is not a key of the env's local view
  expectTypeOf(config.env.local).toHaveProperty("NOPE");
});
