import { getGoogleAccessToken } from "./get-google-access-token.ts";
import type { GoogleSession } from "./google-session.ts";
import { SEARCH_CONSOLE_SITES_URL } from "./search-console-sites-url.constants.ts";
import { WEBMASTERS_SCOPE } from "./webmasters-scope.constants.ts";

/** Submits (or resubmits) a sitemap to the site's Search Console property. */
export async function submitSitemap(
  session: GoogleSession,
  siteUrl: string,
  sitemapUrl: string,
): Promise<{ error?: string; ok: boolean }> {
  const token = await getGoogleAccessToken(session, WEBMASTERS_SCOPE);
  const site = encodeURIComponent(siteUrl);

  const feed = encodeURIComponent(sitemapUrl);

  const response = await session.fetcher(`${SEARCH_CONSOLE_SITES_URL}/${site}/sitemaps/${feed}`, {
    headers: { Authorization: `Bearer ${token}` },
    method: "PUT",
  });

  await response.body?.cancel();

  return response.ok ? { ok: true } : { error: `Sitemap submit failed (${response.status})`, ok: false };
}
