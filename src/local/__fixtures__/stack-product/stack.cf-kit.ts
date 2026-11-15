import { join } from "node:path";

import { createCfKit } from "../../../cf-kit/create-cf-kit.ts";
import { defineInfraConfig } from "../../../define-infra-config.ts";
import { fakeInfraEnv } from "../../../shared/__fixtures__/fake-infra-env.ts";

const config = defineInfraConfig({
  cloudflare: { zone: { domain: "example.com", zoneId: "z".repeat(32) } },
  env: fakeInfraEnv(),
  local: { apps: ["web"], host: "example.localhost", vars: () => ({}) },
});

/** The stack fixture's kit: a zone for the routes, and `web` in `local.apps`. */
export const kit = createCfKit({ config, ratelimitIds: join(import.meta.dirname, "ratelimit-ids.json") });
