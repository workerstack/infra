import type { CloudflareR2Credentials } from "../schema/cloudflare-env.ts";
import type { InfraEnv } from "../schema/infra.ts";
import { R2_SECRET_KEY } from "../shared/infra-keys.constants.ts";
import { INFRA_SCOPES } from "../shared/infra-scopes.constants.ts";
import type { R2CredentialsVerification } from "./r2-credentials-verification.ts";
import { R2_ENDPOINT_PATTERN } from "./r2-endpoint-pattern.constants.ts";

/**
 * Checks the access key id is set, `R2_SECRET_ACCESS_KEY` has a value in some scope of the env, and the endpoint
 * is an R2 S3 endpoint. The secret's value is never read into the result.
 */
export function verifyR2Credentials(r2: CloudflareR2Credentials, env: InfraEnv): R2CredentialsVerification {
  const hasSecret = INFRA_SCOPES.some((scope) => (env[scope][R2_SECRET_KEY] ?? "") !== "");

  return {
    endpointValid: R2_ENDPOINT_PATTERN.test(r2.endpoint),
    hasCredentials: r2.accessKeyId.length > 0 && hasSecret,
  };
}
