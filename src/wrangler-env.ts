import { assertNotUnderTest } from "./assert-not-under-test.ts";
import type { ChildEnv } from "./child-env.ts";
import { cloudflareCredentials } from "./credentials.ts";
import { env as processEnv } from "./env.ts";
import type { InfraEnv } from "./schema/infra.ts";

/** The env a wrangler child runs with: `base` plus the account credentials from `env`. */
export function wranglerEnv(env: InfraEnv, base: ChildEnv = processEnv): ChildEnv {
  assertNotUnderTest(base);

  const credentials = cloudflareCredentials(env);

  return {
    ...base,
    CI: "true",
    CLOUDFLARE_ACCOUNT_ID: credentials.accountId,
    CLOUDFLARE_API_KEY: credentials.apiKey,
    CLOUDFLARE_API_TOKEN: credentials.apiToken,
    CLOUDFLARE_EMAIL: credentials.accountEmail,
  };
}
