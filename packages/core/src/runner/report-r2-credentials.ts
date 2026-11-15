import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { R2CredentialsVerification } from "./r2-credentials-verification.ts";

/** Prints whether the R2 keys are present and the endpoint is valid. */
export function reportR2Credentials(check: R2CredentialsVerification, log: Log = stdoutLog): void {
  const keys = check.hasCredentials ? "✓" : "✗ missing";
  const endpoint = check.endpointValid ? "✓" : "✗ invalid";

  log(`  R2 Credentials: keys ${keys}, endpoint ${endpoint}`);
}
