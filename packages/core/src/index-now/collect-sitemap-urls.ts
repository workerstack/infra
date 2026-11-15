import { fetchSitemap } from "./fetch-sitemap.ts";
import type { IndexNowTarget } from "./index-now-target.ts";

function onHost(url: string, host: string): boolean {
  return URL.canParse(url) && new URL(url).host === host;
}

async function pageUrls(target: IndexNowTarget, url: string): Promise<string[]> {
  const sitemap = await fetchSitemap(target, url);

  if (!sitemap.index) return sitemap.locs;

  const children = await Promise.all(sitemap.locs.map((child) => fetchSitemap(target, child)));

  return children.flatMap((child) => (child.index ? [] : child.locs));
}

/** Every page URL the sitemaps list on the host, once each, following a sitemap index one level down. */
export async function collectSitemapUrls(target: IndexNowTarget): Promise<string[]> {
  const lists = await Promise.all(target.config.sitemapUrls.map((url) => pageUrls(target, url)));

  return [...new Set(lists.flat().filter((url) => onHost(url, target.host)))];
}
