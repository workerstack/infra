import { expect, it } from "vitest";

import { sitemapXml } from "./__fixtures__/sitemap-xml.ts";
import { sitemapLocs } from "./sitemap-locs.ts";

it("sitemapLocs reads each <loc> of a urlset and decodes its entities", () => {
  const xml = sitemapXml(["https://example.com/a", " https://example.com/b?x=1&amp;y=2 "]);

  expect(sitemapLocs(xml)).toStrictEqual({
    index: false,
    locs: ["https://example.com/a", "https://example.com/b?x=1&y=2"],
  });
});

it("sitemapLocs marks a sitemap index", () => {
  expect(sitemapLocs(sitemapXml(["https://example.com/s1.xml"], true))).toStrictEqual({
    index: true,
    locs: ["https://example.com/s1.xml"],
  });
});
