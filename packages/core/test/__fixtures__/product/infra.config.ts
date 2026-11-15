import { join } from "node:path";

import { defineInfraConfig } from "../../../src/define-infra-config.ts";

const ID_LENGTH = 32;

function view(scope: string) {
  const host = scope === "prod" ? "example.com" : `${scope}.example.com`;

  return { API_KEY: `key-${scope}`, GREETING: `hi ${scope}`, SITE_URL: `https://${host}/app` };
}

function bindings(scope: string) {
  return { d1_databases: { DB: { database_id: `db-${scope}-id`, database_name: `db-${scope}` } } };
}

// A fixed env: its `API_KEY` counts as sealed but holds a fake value, so no key is needed to read it.
export default defineInfraConfig({
  cloudflare: {
    bindings: { dev: bindings("dev"), local: bindings("local"), prod: bindings("prod") },
    workers: {
      migrations: { DB: { database: "main", dir: join(import.meta.dirname, "db/migrations"), owner: "web-api" } },
    },
    zone: { domain: "example.com", zoneId: "z".repeat(ID_LENGTH) },
  },
  env: {
    dev: view("dev"),
    global: {},
    local: view("local"),
    prod: view("prod"),
    sealedKeys: () => new Set(["API_KEY"]),
  },
  local: { host: "example.localhost", vars: (origin) => ({ SITE_URL: `${origin.origin}/app` }) },
});
