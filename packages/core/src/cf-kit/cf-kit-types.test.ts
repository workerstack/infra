import { defineEnv, sealed } from "@workerstack/repo/env";
import { expectTypeOf, it } from "vitest";

import { defineInfraConfig } from "../define-infra-config.ts";

// `sealed(...)` builds a value without any age key; nothing here reads it, only its key counts as sealed.
const CIPHER = "cipher";

const env = defineEnv({
  dev: { API_KEY: sealed(CIPHER) },
  global: {},
  local: { APEX_DOMAIN: "localhost", API_KEY: sealed(CIPHER), GREETING: "hi" },
  prod: { API_KEY: sealed(CIPHER) },
});

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
  expectTypeOf(kit.vars("local", (e) => [e.APEX_DOMAIN, e.CF_ZONE_ID])).toHaveProperty("APEX_DOMAIN");
});

// Never called: the names are checked by the compiler alone, and sealed-ness only at run time.
function grants() {
  return kit.secrets((e) => [e.API_KEY, e.CF_API_TOKEN]);
}

it("accepts sealed keys and infra credentials as secrets", () => {
  expectTypeOf(grants).returns.toHaveProperty("CF_API_TOKEN");
  expectTypeOf(grants).returns.toHaveProperty("API_KEY");
});

// Reads a key without returning it: a property the map lacks stays a compile error, and the pick returns nothing.
function none(..._keys: unknown[]): never[] {
  return [];
}

// Never called: each line is a compile error, not a run-time check.
function rejected() {
  // @ts-expect-error NOPE is no d1 binding of the config
  kit.d1("local", "NOPE");
  // @ts-expect-error NOPE is no kv binding of the config
  kit.kv("local", "NOPE");
  // @ts-expect-error NOPE is no key of the env's views
  kit.vars("local", (e) => none(e.NOPE));
  // @ts-expect-error NOPE is no key of the env's views
  kit.secrets((e) => none(e.NOPE));
  // @ts-expect-error a sealed key is granted with secrets, never as a var
  kit.vars("local", (e) => none(e.API_KEY));
  // @ts-expect-error a plain key is no secret
  kit.secrets((e) => none(e.GREETING));
  // @ts-expect-error an infra credential is granted with secrets, never as a var
  kit.vars("local", (e) => none(e.CF_API_TOKEN));
  // @ts-expect-error an infra var is no secret
  kit.secrets((e) => none(e.CF_ZONE_ID));
  // @ts-expect-error NOPE is no d1 binding of the config
  kit.worker("w", { d1: ["NOPE"], entrypoint: "./src/index.ts" });
  // @ts-expect-error NOPE is no kv binding of the config
  kit.worker("w", { entrypoint: "./src/index.ts", kv: ["NOPE"] });
  // @ts-expect-error NOPE is no key of the env's views
  kit.worker("w", { entrypoint: "./src/index.ts", vars: (e) => none(e.NOPE) });
  // @ts-expect-error NOPE is no key of the env's views
  kit.worker("w", { entrypoint: "./src/index.ts", secrets: (e) => none(e.NOPE) });
  // @ts-expect-error a sealed key is no var
  kit.worker("w", { entrypoint: "./src/index.ts", vars: (e) => none(e.API_KEY) });
  // @ts-expect-error a plain key is no secret
  kit.worker("w", { entrypoint: "./src/index.ts", secrets: (e) => none(e.GREETING) });
  const names = ["GREETING"];

  // @ts-expect-error the string form is gone
  kit.worker("w", { entrypoint: "./src/index.ts", vars: names });
  // @ts-expect-error NOPE is no key of the env's views, inside the scope callback too
  kit.worker("w", () => ({ entrypoint: "./src/index.ts", vars: (e) => none(e.NOPE) }));
  // @ts-expect-error NOPE is no d1 binding of the config, inside the scope callback too
  kit.worker("w", () => ({ d1: ["NOPE"], entrypoint: "./src/index.ts" }));
  // @ts-expect-error minify is a boolean
  kit.worker("w", { entrypoint: "./src/index.ts", minify: "yes" });
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
  return kit.vars("local", (e) => [e.APEX_DOMAIN]).ENVIRONMENT.value;
}

it("keeps the names of limiters, services and the scope of ENVIRONMENT", () => {
  expectTypeOf(limiter).returns.toHaveProperty("RL_5");
  expectTypeOf(limiter).returns.not.toHaveProperty("RL_6");
  expectTypeOf(services).returns.not.toHaveProperty("OTHER_SERVICE");
  expectTypeOf(environment).returns.toEqualTypeOf<"local">();
});

function worker() {
  return kit.worker("w", {
    entrypoint: "./src/index.ts",
    secrets: (e) => [e.API_KEY, e.CF_API_TOKEN],
    vars: (e) => [e.GREETING, e.CF_ZONE_ID],
  });
}

it("accepts the right picks in a worker", () => {
  expectTypeOf(worker).toBeFunction();
});

// Never called: a plain-object env gives no sealed names, so every key is in both maps; the run-time check refuses.
const plain = defineInfraConfig({
  env: { dev: {}, global: {}, local: { GREETING: "hi", TOKEN: "t" }, prod: {}, sealedKeys: () => new Set<string>() },
});

function open() {
  return {
    secrets: plain.secrets((e) => [e.GREETING, e.TOKEN]),
    vars: plain.vars("local", (e) => [e.GREETING, e.TOKEN]),
  };
}

it("offers every key of a plain-object env in both maps", () => {
  expectTypeOf(open).returns.toHaveProperty("secrets");
  expectTypeOf(open).returns.toHaveProperty("vars");
  expectTypeOf<ReturnType<typeof open>["secrets"]>().toHaveProperty("TOKEN");
  expectTypeOf<ReturnType<typeof open>["vars"]>().toHaveProperty("GREETING");
});

function built() {
  return [
    kit.worker("w", {
      assetsDirectory: "./assets",
      entrypoint: "./src/index.ts",
      minify: false,
      uploadSourceMaps: true,
    }),
    kit.worker("w", (scope) => ({
      entrypoint: "./src/index.ts",
      vars: (e) => [e.GREETING],
      ...(scope === "prod" ? { routes: ["acme.ai/*"] } : {}),
    })),
  ];
}

it("accepts the build keys and a scope callback", () => {
  expectTypeOf(built).toBeFunction();
});
