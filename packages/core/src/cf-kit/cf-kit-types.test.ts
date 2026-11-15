import { defineEnv } from "@workerstack/repo/env";
import { expectTypeOf, it } from "vitest";

import { defineInfraConfig } from "../define-infra-config.ts";

const env = defineEnv({ dev: {}, global: {}, local: { APEX_DOMAIN: "localhost" }, prod: {} });

const config = defineInfraConfig({
  cloudflare: {
    bindings: {
      local: {
        d1_databases: { MAIN_DB: { database_id: "i", database_name: "n" } },
        kv_namespaces: { CACHE_KV: { id: "kv" } },
      },
    },
    zone: { domain: "acme.ai", zoneId: "z".repeat(32) },
  },
  env,
});

const kit = config;

it("accepts the names the config and env declare", () => {
  expectTypeOf(kit.d1("local", "MAIN_DB")).toHaveProperty("MAIN_DB");
  expectTypeOf(kit.kv("local", "CACHE_KV")).toHaveProperty("CACHE_KV");
  expectTypeOf(kit.vars("local", "APEX_DOMAIN", "CF_ZONE_ID")).toHaveProperty("APEX_DOMAIN");
});

// Never called: the names are checked by the compiler alone, and sealed-ness only at run time.
function grants() {
  return kit.secrets("APEX_DOMAIN", "CF_API_TOKEN");
}

it("accepts view keys and infra credentials as secrets", () => {
  expectTypeOf(grants).returns.toHaveProperty("CF_API_TOKEN");
});

// Never called: each line is a compile error, not a run-time check.
function rejected() {
  // @ts-expect-error NOPE is no d1 binding of the config
  kit.d1("local", "NOPE");
  // @ts-expect-error NOPE is no kv binding of the config
  kit.kv("local", "NOPE");
  // @ts-expect-error NOPE is no key of the env's views
  kit.vars("local", "NOPE");
  // @ts-expect-error NOPE is no key of the env's views
  kit.secrets("NOPE");
  // @ts-expect-error an infra credential is granted with secrets, never as a var
  kit.vars("local", "CF_API_TOKEN");
  // @ts-expect-error NOPE is no d1 binding of the config
  kit.worker("w", { d1: ["NOPE"], entrypoint: "./src/index.ts" });
  // @ts-expect-error NOPE is no kv binding of the config
  kit.worker("w", { entrypoint: "./src/index.ts", kv: ["NOPE"] });
  // @ts-expect-error NOPE is no key of the env's views
  kit.worker("w", { entrypoint: "./src/index.ts", vars: ["NOPE"] });
  // @ts-expect-error NOPE is no key of the env's views
  kit.worker("w", { entrypoint: "./src/index.ts", secrets: ["NOPE"] });
}

it("rejects a name the config or env does not declare", () => {
  expectTypeOf(rejected).toBeFunction();
});

// Never called: a limiter needs a registry id at run time, and only its type is read.
function limiter() {
  return kit.ratelimits("w", "local", { name: "RL_5", simple: { limit: 5, period: 60 } });
}

function services() {
  return kit.services("local", { LANDING_SERVICE: "acme-landing" });
}

function environment() {
  return kit.vars("local", "APEX_DOMAIN").ENVIRONMENT.value;
}

it("keeps the names of limiters, services and the scope of ENVIRONMENT", () => {
  expectTypeOf(limiter).returns.toHaveProperty("RL_5");
  expectTypeOf(limiter).returns.not.toHaveProperty("RL_6");
  expectTypeOf(services).returns.not.toHaveProperty("OTHER_SERVICE");
  expectTypeOf(environment).returns.toEqualTypeOf<"local">();
});
