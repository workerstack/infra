import { defineInfraConfig } from "../../../define-infra-config.ts";
import { fakeInfraEnv } from "../../../shared/__fixtures__/fake-infra-env.ts";

/** The stack fixture's config and kit: a zone for the routes, and `web` in `local.apps`. */
export default defineInfraConfig({
  cloudflare: { zone: { domain: "example.com", zoneId: "z".repeat(32) } },
  env: fakeInfraEnv(),
  local: { apps: ["web"], host: "example.localhost" },
});
