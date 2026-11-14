import { INFRA_SCOPES } from "../shared/infra-scopes.constants.ts";
import { getSiteInfo } from "./get-site-info.ts";
import { GOOGLE_CLIENT_ID_PATTERN } from "./google-client-id-pattern.constants.ts";
import { googleSessionFor } from "./google-session-for.ts";
import type { GoogleTarget } from "./google-target.ts";
import type { GoogleVerifyResult } from "./google-verify-result.ts";
import { listSitemaps } from "./list-sitemaps.ts";

/** Checks each client id's format, and the Search Console site and its sitemaps. */
export async function verifyGoogleConfig(target: GoogleTarget): Promise<GoogleVerifyResult> {
  const result: GoogleVerifyResult = { oauth: [] };

  for (const scope of INFRA_SCOPES) {
    const oauth = target.config.oauth?.[scope];

    if (oauth !== undefined) {
      result.oauth.push({
        authBaseUrl: oauth.authBaseUrl,
        clientIdValid: GOOGLE_CLIENT_ID_PATTERN.test(oauth.clientId),
        env: scope,
        redirectOrigins: oauth.redirectOrigins,
      });
    }
  }

  const sc = target.config.searchConsole;

  if (sc === undefined) return result;

  if (sc.serviceAccountEmail === "") {
    result.searchConsole = { siteVerified: false, sitemaps: [] };

    return result;
  }

  const session = googleSessionFor(target, sc.serviceAccountEmail);
  const site = await getSiteInfo(session, sc.siteUrl);
  const sitemaps = site === undefined ? [] : await listSitemaps(session, sc.siteUrl);

  result.searchConsole = {
    siteVerified: site !== undefined,
    sitemaps: sitemaps.map((sitemap) => ({ lastSubmitted: sitemap.lastSubmitted, path: sitemap.path })),
  };

  return result;
}
