import { getGoogleAccessToken } from "./get-google-access-token.ts";
import type { GoogleSession } from "./google-session.ts";
import { SEARCH_CONSOLE_SITES_URL } from "./search-console-sites-url.constants.ts";
import type { SitemapInfo } from "./sitemap-info.ts";
import { WEBMASTERS_SCOPE } from "./webmasters-scope.constants.ts";

/** The sitemaps Search Console knows for the site; empty when the call fails. */
export async function listSitemaps(session: GoogleSession, siteUrl: string): Promise<SitemapInfo[]> {
  const token = await getGoogleAccessToken(session, WEBMASTERS_SCOPE);

  const response = await session.fetcher(`${SEARCH_CONSOLE_SITES_URL}/${encodeURIComponent(siteUrl)}/sitemaps`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    await response.body?.cancel();

    return [];
  }

  const data = (await response.json()) /* Search Console's sitemap list */ as { sitemap?: SitemapInfo[] };

  return data.sitemap ?? [];
}
