import { defineInfraConfig } from "../../define-infra-config.ts";
import type { InfraEnv } from "../../schema/infra.ts";
import type { CloudflareWorkers } from "../../schema/workers.ts";
import { fakeInfraEnv } from "../../shared/__fixtures__/fake-infra-env.ts";

const ID_LENGTH = 32;

/** The sealed keys of the fixture env, in every scope. */
export const FIXTURE_SEALED = ["CF_API_TOKEN", "JWT_SECRET", "R2_SECRET_ACCESS_KEY", "TURNSTILE_SECRET_KEY"];

/** An env whose views hold one value per scope; sealed values read decrypted, like a `defineEnv` view. */
export function fixtureEnv(): InfraEnv {
  const view = (scope: string) => ({
    APEX_DOMAIN: scope === "prod" ? "acme.ai" : `${scope}.acme.ai`,
    CF_API_TOKEN: `token-${scope}`,
    JWT_SECRET: `jwt-${scope}`,
    R2_SECRET_ACCESS_KEY: `r2-${scope}`,
    TURNSTILE_SECRET_KEY: `ts-${scope}`,
  });

  return fakeInfraEnv(
    {
      dev: view("dev"),
      global: { CLOUDFLARE_ACCOUNT_ID: "a".repeat(ID_LENGTH) },
      local: { ...view("local"), MISSING: "set in local only" },
      prod: view("prod"),
    },
    FIXTURE_SEALED,
  );
}

function bindings(scope: string) {
  return {
    d1_databases: { MAIN_DB: { database_id: `core-${scope}-id`, database_name: `core-${scope}` } },
    kv_namespaces: { CACHE_KV: { id: `kv-${scope}` } },
    queues: { QUEUE: { queue: `q-${scope}` }, QUEUE_DLQ: { queue: `dlq-${scope}` } },
    r2_buckets: { CDN: { bucket_name: `cdn-${scope}` } },
  };
}

/**
 * A config over `env` with a zone, R2 credentials, a dev turnstile widget, bindings in every scope and the
 * Workers' options `workers`; its value is the kit too.
 */
export function fixtureConfig(env: InfraEnv = fixtureEnv(), workers: CloudflareWorkers = {}) {
  return defineInfraConfig({
    cloudflare: {
      bindings: {
        dev: {
          ...bindings("dev"),
          ai_search: { DOCS: { binding: "DOCS", instance_name: "docs-dev" } },
          analytics_engine_datasets: { EVENTS: { binding: "EVENTS", dataset: "events-dev" } },
        },
        local: bindings("local"),
        prod: bindings("prod"),
      },
      r2: { accessKeyId: "r2-key", endpoint: "https://acct.r2.cloudflarestorage.com" },
      turnstile: {
        dev: { domains: ["dev.acme.ai"], mode: "managed", name: "dev", siteKey: "site-dev" },
      },
      workers,
      zone: { domain: "acme.ai", zoneId: "z".repeat(ID_LENGTH) },
    },
    env,
  });
}
