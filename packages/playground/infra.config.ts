import { defineInfraConfig } from "@workerstack/infra";

import { web } from "./web.env.ts";

// Plain fake values in web.env.ts: gen and loc need no Cloudflare account and no key. The local stack sets no
// URL vars, and a rate limit's id would land in ratelimit-ids.json here.
export default /* @__PURE__ */ defineInfraConfig({
  cloudflare: { zone: { domain: "example.com", zoneId: "0123456789abcdef0123456789abcdef" } },
  env: web,
  local: { host: "playground.localhost" },
});
