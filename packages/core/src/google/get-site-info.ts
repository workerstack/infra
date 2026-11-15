import { getGoogleAccessToken } from "./get-google-access-token.ts";
import type { GoogleSession } from "./google-session.ts";
import { SEARCH_CONSOLE_SITES_URL } from "./search-console-sites-url.constants.ts";
import type { SiteInfo } from "./site-info.ts";
import { WEBMASTERS_SCOPE } from "./webmasters-scope.constants.ts";

/** The site's Search Console entry, or undefined when the service account cannot see it. */
export async function getSiteInfo(session: GoogleSession, siteUrl: string): Promise<SiteInfo | undefined> {
  const token = await getGoogleAccessToken(session, WEBMASTERS_SCOPE);

  const response = await session.fetcher(`${SEARCH_CONSOLE_SITES_URL}/${encodeURIComponent(siteUrl)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    await response.body?.cancel();

    return undefined;
  }

  return (await response.json()) /* Search Console's site resource */ as SiteInfo;
}
