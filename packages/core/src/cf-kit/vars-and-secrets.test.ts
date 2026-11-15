import { describe, expect, it } from "vitest";

import { defineInfraConfig } from "../define-infra-config.ts";
import type { InfraEnv } from "../schema/infra.ts";
import { fakeInfraEnv } from "../shared/__fixtures__/fake-infra-env.ts";
import { fixtureConfig, fixtureEnv } from "./__fixtures__/kit-fixtures.ts";
import type { EnvKeyRef } from "./cf-kit-types.ts";

const kit = fixtureConfig();

// A pick of named keys, for the thunks that must throw: one callback less than writing the lambda in place.
function keys(...names: string[]) {
  return (env: Record<string, EnvKeyRef | undefined>) => names.map((name) => env[name]);
}

describe("vars", () => {
  it("writes ENVIRONMENT and the plain keys of the scope as text bindings", () => {
    expect(kit.vars("prod", (e) => [e.APEX_DOMAIN])).toStrictEqual({
      APEX_DOMAIN: { type: "text", value: "acme.ai" },
      ENVIRONMENT: { type: "text", value: "prod" },
    });
  });

  it("takes ENVIRONMENT from the scope's own values when they set it", () => {
    const env = fakeInfraEnv({ dev: { ENVIRONMENT: "staging", SITE: "s" } });
    const own = fixtureConfig(env);

    expect(own.vars("dev", (e) => [e.SITE])).toStrictEqual({
      ENVIRONMENT: { type: "text", value: "staging" },
      SITE: { type: "text", value: "s" },
    });
  });

  it("refuses a sealed key, naming the scope and kit.secrets", () => {
    expect(() => kit.vars("local", keys("JWT_SECRET"))).toThrow(
      "JWT_SECRET is sealed in local; ask kit.secrets for it, not kit.vars",
    );
  });

  it("names the key and scope when a plain value is missing", () => {
    expect(() => kit.vars("dev", keys("MISSING"))).toThrow("MISSING has no dev value in env");
  });
});

describe("secrets", () => {
  it("declares a binding per sealed key and carries no value", () => {
    expect(kit.secrets((e) => [e.JWT_SECRET, e.CF_API_TOKEN])).toStrictEqual({
      CF_API_TOKEN: { type: "secret" },
      JWT_SECRET: { type: "secret" },
    });
  });

  it("refuses a key that is not sealed in every scope, naming the fix", () => {
    expect(() => kit.secrets(keys("APEX_DOMAIN"))).toThrow(
      "APEX_DOMAIN is not sealed in local; a secret must be sealed: bun repo env set APEX_DOMAIN --scope local",
    );
  });

  it("names the first scope that holds the key in plain text", () => {
    const base = fixtureEnv();
    const env: InfraEnv = { ...base, sealedKeys: (scope) => (scope === "prod" ? new Set() : new Set(["GREETING"])) };
    const mixed = fixtureConfig(env);

    expect(() => mixed.secrets(keys("GREETING"))).toThrow(
      "GREETING is not sealed in prod; a secret must be sealed: bun repo env set GREETING --scope prod",
    );
  });
});

describe("infra values", () => {
  it("come from the config, and the account id from the env's global values", () => {
    expect(kit.vars("dev", (e) => [e.CF_ACCOUNT_ID, e.CF_ZONE_ID, e.R2_BUCKET_NAME])).toMatchObject({
      CF_ACCOUNT_ID: { type: "text", value: "a".repeat(32) },
      CF_ZONE_ID: { type: "text", value: "z".repeat(32) },
      R2_BUCKET_NAME: { type: "text", value: "cdn-dev" },
    });
    expect(kit.vars("prod", (e) => [e.R2_ENDPOINT, e.R2_ACCESS_KEY_ID])).toMatchObject({
      R2_ACCESS_KEY_ID: { value: "r2-key" },
      R2_ENDPOINT: { value: "https://acct.r2.cloudflarestorage.com" },
    });
  });

  it("read a scope's turnstile site key, falling back to dev's widget", () => {
    expect(kit.vars("dev", (e) => [e.TURNSTILE_SITE_KEY]).TURNSTILE_SITE_KEY.value).toBe("site-dev");
    expect(kit.vars("prod", (e) => [e.TURNSTILE_SITE_KEY]).TURNSTILE_SITE_KEY.value).toBe("site-dev");
  });

  it("fail naming the key and scope when infra has no value", () => {
    const bare = defineInfraConfig({ env: fakeInfraEnv() });

    expect(() => bare.vars("dev", keys("CF_ZONE_ID"))).toThrow("CF_ZONE_ID has no dev value in infra");
  });

  it("keep the sealed credentials out of vars and in secrets", () => {
    expect(() => kit.vars("dev", keys("TURNSTILE_SECRET_KEY"))).toThrow("TURNSTILE_SECRET_KEY is sealed in dev");
    expect(Object.keys(kit.secrets((e) => [e.TURNSTILE_SECRET_KEY, e.R2_SECRET_ACCESS_KEY]))).toStrictEqual([
      "TURNSTILE_SECRET_KEY",
      "R2_SECRET_ACCESS_KEY",
    ]);
  });
});
