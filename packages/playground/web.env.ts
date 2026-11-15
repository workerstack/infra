import { defineEnv } from "@workerstack/repo/env";

// Plain fake values: gen and loc need no Cloudflare account and no key, so nothing here is sealed.
export const web = /* @__PURE__ */ defineEnv({
  dev: { GREETING: "hello from dev" },
  global: {},
  local: { GREETING: "hello from local" },
  prod: { GREETING: "hello from prod" },
});
