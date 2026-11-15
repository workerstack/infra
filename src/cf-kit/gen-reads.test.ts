import { describe, expect, it } from "vitest";

import { defineInfraConfig } from "../define-infra-config.ts";
import { fakeInfraEnv } from "../shared/__fixtures__/fake-infra-env.ts";
import { fixtureConfig } from "./__fixtures__/kit-fixtures.ts";
import type { CfKit } from "./cf-kit.ts";
import { createCfKit } from "./create-cf-kit.ts";
import { isCfKit } from "./is-cf-kit.ts";

const kit = createCfKit({ config: fixtureConfig(), ratelimitIds: "r.json" });
const ZONE = { domain: "acme.ai", zoneId: "z".repeat(32) };

describe("isCfKit", () => {
  it("recognises a kit among a module's exports and nothing else", () => {
    expect(isCfKit(kit)).toBe(true);
    expect(isCfKit({ envs: [] })).toBe(false);
    expect(isCfKit(null)).toBe(false);
  });

  it("is a CfKit for any name once narrowed", () => {
    const value: unknown = kit;

    expect(isCfKit(value) && value.envs.length).toBe(3);
  });
});

describe("secretValues", () => {
  it("hands out the values of the declared secrets for one scope", () => {
    expect(kit.secretValues("prod", ["JWT_SECRET", "CF_API_TOKEN"])).toStrictEqual({
      CF_API_TOKEN: "token-prod",
      JWT_SECRET: "jwt-prod",
    });
  });

  it("fails naming the key and scope when a value is missing or empty", () => {
    expect(() => kit.secretValues("dev", ["MISSING"])).toThrow("MISSING has no dev value in env");

    const empty = createCfKit({
      config: fixtureConfig(fakeInfraEnv({ local: { JWT_SECRET: "" } }, ["JWT_SECRET"])),
      ratelimitIds: "r.json",
    });

    expect(() => empty.secretValues("local", ["JWT_SECRET"])).toThrow("JWT_SECRET has no local value in env");
  });
});

describe("migrationsDir", () => {
  it("names the directory a D1 binding owns, for the Worker that owns it alone", () => {
    const owner = createCfKit({
      config: fixtureConfig(),
      migrations: { MAIN_DB: { dir: "/repo/db/migrations", owner: "acme-api" } },
      ratelimitIds: "r.json",
    });

    expect(owner.migrationsDir("prod", "acme-api-prod", "MAIN_DB")).toBe("/repo/db/migrations");
    expect(owner.migrationsDir("prod", "acme-api-dev", "MAIN_DB")).toBeUndefined();
    expect(owner.migrationsDir("prod", "acme-cron-prod", "MAIN_DB")).toBeUndefined();
    expect(kit.migrationsDir("prod", "acme-api-prod", "MAIN_DB")).toBeUndefined();
  });
});

describe("zone and local facts", () => {
  it("lists the apps the zone sends to their locale, none when it lists none", () => {
    const zoned = createCfKit({
      config: defineInfraConfig({
        cloudflare: { zone: { ...ZONE, redirects: { locale: ["web/site"] } } },
        env: fakeInfraEnv(),
      }),
      ratelimitIds: "r.json",
    });

    expect(zoned.localeApps).toStrictEqual(["web/site"]);
    expect(kit.localeApps).toStrictEqual([]);
    expect(kit.zoneDomain).toBe("acme.ai");
  });

  it("computes the local URL vars from the running origin, or the portless host", () => {
    const local = createCfKit({
      config: defineInfraConfig({
        env: fakeInfraEnv(),
        local: { host: "acme.localhost", vars: (origin) => ({ WEB_APP_URL: `${origin.origin}/app` }) },
      }),
      ratelimitIds: "r.json",
    });

    const loose: CfKit = kit;

    expect(local.localUrlVars()).toStrictEqual({ WEB_APP_URL: "http://acme.localhost/app" });
    expect(local.localUrlVars("http://acme.localhost:1356")).toStrictEqual({
      WEB_APP_URL: "http://acme.localhost:1356/app",
    });
    expect(loose.localUrlVars("http://acme.localhost:1356")).toStrictEqual({});
    expect([local.localHost, kit.localHost]).toStrictEqual(["acme.localhost", undefined]);
  });
});
