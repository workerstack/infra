import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { GoogleVerifyResult } from "./google-verify-result.ts";

/** Prints the Google verification: each scope's client id check, then Search Console. */
export function reportGoogle(result: GoogleVerifyResult, log: Log = stdoutLog): void {
  if (result.oauth.length > 0) log("  OAuth:");

  for (const oauth of result.oauth) {
    log(`    [${oauth.env}] Client ID: ${oauth.clientIdValid ? "✓" : "✗"}`);
    log(`    [${oauth.env}] Auth URL: ${oauth.authBaseUrl}`);
    log(`    [${oauth.env}] Redirect origins: ${oauth.redirectOrigins.join(", ")}`);
  }

  const { searchConsole } = result;

  if (searchConsole === undefined) return;

  log("  Search Console:");
  log(`    Site verified: ${searchConsole.siteVerified ? "✓" : "✗"}`);

  if (searchConsole.sitemaps.length === 0) return;

  log("    Sitemaps:");

  for (const sitemap of searchConsole.sitemaps) log(`      ${sitemap.path} (submitted ${sitemap.lastSubmitted})`);
}
