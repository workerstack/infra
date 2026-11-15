import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { AppleVerifyResult } from "./apple-verify-result.ts";

/** Prints the Apple verification: each scope's wiring and key check, then the JWKS endpoint. */
export function reportApple(result: AppleVerifyResult, log: Log = stdoutLog): void {
  if (result.oauth.length > 0) log("  OAuth:");

  for (const oauth of result.oauth) {
    log(`    [${oauth.env}] Service ID: ${oauth.serviceId}`);
    log(`    [${oauth.env}] Team ID: ${oauth.teamId}`);
    log(`    [${oauth.env}] Key ID: ${oauth.keyId}`);
    log(`    [${oauth.env}] Key valid: ${oauth.keyValid ? "✓" : "✗"}`);
    log(`    [${oauth.env}] Redirect origins: ${oauth.redirectOrigins.join(", ")}`);
  }

  log(`  JWKS endpoint: ${result.jwksReachable ? "reachable ✓" : "unreachable ✗"}`);
}
