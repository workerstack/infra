import { join } from "node:path";

import { createCfKit } from "../../../cf-kit/create-cf-kit.ts";
import { defineInfraConfig } from "../../../define-infra-config.ts";
import { fakeInfraEnv } from "../../../shared/__fixtures__/fake-infra-env.ts";

const ID_LENGTH = 32;

function view(scope: string): Record<string, string> {
  const host = scope === "prod" ? "example.com" : `${scope}.example.com`;

  return { API_KEY: `key-${scope}`, GREETING: `hi ${scope}`, SITE_URL: `https://${host}/app` };
}

function bindings(scope: string) {
  return { d1_databases: { DB: { database_id: `db-${scope}-id`, database_name: `db-${scope}` } } };
}

const config = defineInfraConfig({
  cloudflare: {
    bindings: { dev: bindings("dev"), local: bindings("local"), prod: bindings("prod") },
    zone: { domain: "example.com", zoneId: "z".repeat(ID_LENGTH) },
  },
  env: fakeInfraEnv({ dev: view("dev"), local: view("local"), prod: view("prod") }, ["API_KEY"]),
  local: { host: "example.localhost", vars: (origin) => ({ SITE_URL: `${origin.origin}/app` }) },
});

/**
 * A product's kit for the generator's tests: one D1 with migrations, a sealed secret, a URL var the local stack
 * overrides, and a rate limit whose id the generator allocates.
 */
export const kit = createCfKit({
  config,
  migrations: { DB: { dir: join(import.meta.dirname, "db/migrations"), owner: "web-api" } },
  ratelimitIds: join(import.meta.dirname, "ratelimit-ids.json"),
});
