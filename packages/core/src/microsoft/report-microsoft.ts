import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { MicrosoftVerifyResult } from "./microsoft-verify-result.ts";

/** Prints the Microsoft verification: each scope's app, audience, redirect URIs and secret count. */
export function reportMicrosoft(result: MicrosoftVerifyResult, log: Log = stdoutLog): void {
  if (result.oauth.length > 0) log("  OAuth:");

  for (const oauth of result.oauth) {
    log(`    [${oauth.env}] ${oauth.appName} ${oauth.exists ? "✓" : "✗"}`);
    log(`      Audience: ${oauth.signInAudience}`);
    log(`      Redirect URIs: ${oauth.redirectUris.join(", ")}`);
    log(`      Secrets: ${oauth.secretCount}`);
  }
}
