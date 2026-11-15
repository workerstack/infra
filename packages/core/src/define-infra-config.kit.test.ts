import { join } from "node:path";

import { defineEnv } from "@workerstack/repo/env";
import { expect, expectTypeOf, it } from "vitest";

import { PRODUCT_ROOT } from "./cf-kit/cf-kit.constants.ts";
import { isCfKit } from "./cf-kit/is-cf-kit.ts";
import { defineInfraConfig } from "./define-infra-config.ts";
import { fakeInfraEnv } from "./shared/__fixtures__/fake-infra-env.ts";

const ZONE = { domain: "example.com", zoneId: "0123456789abcdef0123456789abcdef" };

const PRODUCT = join(import.meta.dirname, "cf-config/__fixtures__/product");

const LEAN_BINDINGS = { local: { d1_databases: { DB: { database_id: "db-id", database_name: "db" } } } };

function leanInfra() {
  return defineInfraConfig({
    cloudflare: { bindings: LEAN_BINDINGS, zone: ZONE },
    env: { dev: {}, global: {}, local: { GREETING: "hi" }, prod: {} },
    local: { host: "example.localhost" },
  });
}

it("returns a kit beside the config, with no sealedKeys, local.vars or ratelimitIds", () => {
  const infra = leanInfra();

  expect(isCfKit(infra)).toBe(true);
  expect(infra.scope("development")).toBe("local");
  expect(infra.env.local.GREETING).toBe("hi");
  expect(infra.vars("local", (env) => [env.GREETING])).toStrictEqual({
    ENVIRONMENT: { type: "text", value: "local" },
    GREETING: { type: "text", value: "hi" },
  });
  expect(infra.d1("local", "DB")).toStrictEqual({ DB: { id: "db-id", name: "db", type: "d1" } });
  expect(infra.localUrlVars()).toStrictEqual({});
  expect(() => infra.secrets((env) => [env.GREETING])).toThrow("GREETING is not sealed in local");
});

// Reads a key without returning it: a property the map lacks stays a compile error, and the pick returns nothing.
function none(..._keys: unknown[]): never[] {
  return [];
}

// Never called: each line is a compile error, not a run-time check.
function rejectedNames() {
  const infra = leanInfra();

  // @ts-expect-error NOPE is no d1 binding of the config
  infra.d1("local", "NOPE");
  // @ts-expect-error NOPE is no key of the env's views
  infra.vars("local", (env) => none(env.NOPE));
}

it("types the kit's binding names from the config", () => {
  expectTypeOf(rejectedNames).toBeFunction();
  expectTypeOf(leanInfra().d1("local", "DB")).toHaveProperty("DB");
});

it("takes the kit's options from cloudflare.workers", () => {
  const infra = defineInfraConfig({
    cloudflare: {
      bindings: LEAN_BINDINGS,
      workers: {
        defaults: { compatibilityDate: "2026-01-20" },
        localRemote: ["d1_databases"],
        migrations: { DB: { dir: "/repo/db/migrations", owner: "web-api" } },
        ratelimitIds: "/repo/ids.json",
      },
      zone: ZONE,
    },
    env: fakeInfraEnv(),
  });

  expectTypeOf(infra.defaults).toEqualTypeOf<{ readonly compatibilityDate: "2026-01-20" }>();
  expect(infra.defaults).toStrictEqual({ compatibilityDate: "2026-01-20" });
  expect(infra.d1("local", "DB").DB).toMatchObject({ dev: { remote: true } });
  expect(infra.migrationsDir("prod", "web-api-prod", "DB")).toBe("/repo/db/migrations");
  expect(infra.ratelimitFile()).toBe("/repo/ids.json");
});

it("rejects a migration for a binding the config does not declare", () => {
  expect(() =>
    defineInfraConfig({
      cloudflare: {
        bindings: LEAN_BINDINGS,
        // @ts-expect-error NOPE is no d1 binding of the config
        workers: { migrations: { NOPE: { dir: "/repo/db/migrations", owner: "web-api" } } },
        zone: ZONE,
      },
      env: fakeInfraEnv(),
    }),
  ).not.toThrow();
});

it("puts the registry at the product root it is handed, else the one above the cwd, and fails with none", () => {
  const infra = leanInfra();
  const cwd = process.cwd();

  try {
    process.chdir(join(PRODUCT, "api"));
    expect(infra.ratelimitFile()).toBe(join(PRODUCT, "ratelimit-ids.json"));
    process.chdir("/");
    expect(() => infra.ratelimitFile()).toThrow(
      "no rate-limit registry: set cloudflare.workers.ratelimitIds in infra.config.ts, or run inside the product",
    );
  } finally {
    process.chdir(cwd);
  }

  infra[PRODUCT_ROOT]("/repo/apps/web");
  expect(infra.ratelimitFile()).toBe("/repo/apps/web/ratelimit-ids.json");
});

it("reads a defineEnv instance's views and sealed keys through the env it returns", () => {
  const real = defineEnv({ dev: {}, global: {}, local: { GREETING: "hi" }, prod: {} });
  const infra = defineInfraConfig({ env: real });

  expect(infra.env.local.GREETING).toBe("hi");
  expect(infra.env.sealedKeys("local")).toStrictEqual(real.sealedKeys("local"));
  expect("local" in infra.env).toBe(true);
});
