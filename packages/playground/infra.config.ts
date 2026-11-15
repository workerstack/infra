import { defineInfraConfig } from "@workerstack/infra";

// Plain fake values: gen and loc need no Cloudflare account and no key. No key is sealed, the local stack sets no
// URL vars, and a rate limit's id would land in ratelimit-ids.json here.
export default /* @__PURE__ */ defineInfraConfig({
  cloudflare: { zone: { domain: "example.com", zoneId: "0123456789abcdef0123456789abcdef" } },
  env: {
    dev: { GREETING: "hello from dev" },
    global: {},
    local: { GREETING: "hello from local" },
    prod: { GREETING: "hello from prod" },
  },
  local: { host: "playground.localhost" },
});
