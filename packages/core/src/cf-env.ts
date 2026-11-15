import { assertNotUnderTest } from "./assert-not-under-test.ts";
import type { ChildEnv } from "./child-env.ts";
import { requiredGlobal } from "./credentials.ts";
import { env as processEnv } from "./env.ts";
import type { InfraEnv } from "./schema/infra.ts";

/** The env the `cf` child runs with: `base` plus the account id and API token from `env`. */
export function cfEnv(env: InfraEnv, base: ChildEnv = processEnv): ChildEnv {
  assertNotUnderTest(base);

  return {
    ...base,
    CLOUDFLARE_ACCOUNT_ID: requiredGlobal(env, "CLOUDFLARE_ACCOUNT_ID"),
    CLOUDFLARE_API_TOKEN: requiredGlobal(env, "CLOUDFLARE_API_TOKEN"),
  };
}
