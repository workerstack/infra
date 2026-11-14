import { requiredScoped } from "../credentials.ts";
import { INFRA_SCOPES } from "../shared/infra-scopes.constants.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import type { AppleTarget } from "./apple-target.ts";
import type { AppleVerifyResult } from "./apple-verify-result.ts";
import { isAppleJwksReachable } from "./is-apple-jwks-reachable.ts";
import { isAppleKeyValid } from "./is-apple-key-valid.ts";

/** Checks that Apple's JWKS answers and that each scope's `APPLE_PRIVATE_KEY` imports. */
export async function verifyAppleConfig(target: AppleTarget): Promise<AppleVerifyResult> {
  const result: AppleVerifyResult = {
    jwksReachable: await isAppleJwksReachable(target.fetcher ?? fetch),
    oauth: [],
  };

  await runInOrder([...INFRA_SCOPES], async (scope) => {
    const oauth = target.config.oauth?.[scope];

    if (oauth === undefined) return;

    const keyValid = await isAppleKeyValid(requiredScoped(target.env, scope, "APPLE_PRIVATE_KEY"));

    result.oauth.push({
      env: scope,
      keyId: oauth.keyId,
      keyValid,
      redirectOrigins: oauth.redirectOrigins,
      serviceId: oauth.serviceId,
      teamId: oauth.teamId,
    });
  });

  return result;
}
