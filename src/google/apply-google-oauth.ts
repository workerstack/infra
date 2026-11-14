import type { GoogleConfig } from "../schema/google.ts";
import { INFRA_SCOPES } from "../shared/infra-scopes.constants.ts";
import type { Log } from "../shared/log.ts";
import { maskSecret } from "../shared/mask-secret.ts";
import { GOOGLE_CLIENT_ID_PATTERN } from "./google-client-id-pattern.constants.ts";

/** Prints each scope's Google OAuth wiring and whether its client id has the right format. */
export function applyGoogleOauth(config: GoogleConfig, log: Log): void {
  if (config.oauth === undefined) return;

  log("  OAuth:");

  for (const scope of INFRA_SCOPES) {
    const oauth = config.oauth[scope];

    if (oauth === undefined) continue;

    let status = "(empty)";

    if (oauth.clientId !== "") status = GOOGLE_CLIENT_ID_PATTERN.test(oauth.clientId) ? "✓" : "✗ invalid format";

    log(`    [${scope}] Client ID: ${maskSecret(oauth.clientId)} ${status}`);
    log(`    [${scope}] Auth URL: ${oauth.authBaseUrl}`);
    log(`    [${scope}] Redirect origins: ${oauth.redirectOrigins.join(", ")}`);
  }
}
