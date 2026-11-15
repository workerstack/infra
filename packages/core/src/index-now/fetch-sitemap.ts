import type { IndexNowTarget } from "./index-now-target.ts";
import type { ParsedSitemap } from "./parsed-sitemap.ts";
import { sitemapLocs } from "./sitemap-locs.ts";

/** The parsed sitemap at `url`; throws naming it when it does not answer ok. */
export async function fetchSitemap(target: IndexNowTarget, url: string): Promise<ParsedSitemap> {
  const fetcher = target.fetcher ?? fetch;
  const response = await fetcher(url, {});

  if (!response.ok) {
    await response.body?.cancel();

    throw new Error(`indexNow: sitemap ${url} answered ${String(response.status)}`);
  }

  return sitemapLocs(await response.text());
}
