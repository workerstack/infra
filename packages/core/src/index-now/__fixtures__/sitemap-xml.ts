/** A `<urlset>` sitemap listing `urls`, or a `<sitemapindex>` when `index` is set. */
export function sitemapXml(urls: string[], index = false): string {
  const tag = index ? "sitemap" : "url";
  const entries = urls.map((url) => `<${tag}><loc>${url}</loc></${tag}>`).join("\n");

  return index
    ? `<?xml version="1.0"?>\n<sitemapindex xmlns="x">\n${entries}\n</sitemapindex>`
    : `<?xml version="1.0"?>\n<urlset xmlns="x">\n${entries}\n</urlset>`;
}
