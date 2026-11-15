import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { GithubVerifyResult } from "./github-verify-result.ts";

/** Prints the GitHub verification: each scope's app and slug, the client id check and the secret. */
export function reportGithub(result: GithubVerifyResult, log: Log = stdoutLog): void {
  if (result.oauth.length > 0) log("  OAuth:");

  for (const oauth of result.oauth) {
    log(`    [${oauth.env}] ${oauth.appName} (${oauth.slug}) ${oauth.exists ? "✓" : "✗"}`);
    log(`      Client id: ${oauth.clientId}`);
    log(`      Secret: ${oauth.hasSecret ? "set" : "missing"}`);
  }
}
