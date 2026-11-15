import type { ParsedSitemap } from "./parsed-sitemap.ts";

const LOC = /<loc>([^<]*)<\/loc>/g;

const SITEMAP_INDEX = /<sitemapindex[\s>]/;

// The five predefined XML entities; `&amp;` goes last so an escaped entity stays as text.
function decoded(text: string): string {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

/** Each `<loc>` of a sitemap, decoded and trimmed, and whether it is a `<sitemapindex>`. */
export function sitemapLocs(xml: string): ParsedSitemap {
  const locs = Array.from(xml.matchAll(LOC), (match) => decoded((match[1] ?? "").trim()));

  return { index: SITEMAP_INDEX.test(xml), locs };
}
