import { expect, it } from "vitest";

import { collectLines } from "../google/__fixtures__/collect-lines.ts";
import { routeFetch } from "./__fixtures__/route-fetch.ts";
import { sitemapXml } from "./__fixtures__/sitemap-xml.ts";
import { reportIndexNow } from "./report-index-now.ts";
import { verifyIndexNowConfig } from "./verify-index-now-config.ts";

const KEY_FILE = "https://example.com/abcd1234-key.txt";
const config = { key: "abcd1234-key", sitemapUrls: ["https://example.com/sitemap.xml"] };
const sitemap = { body: sitemapXml(["https://example.com/", "https://example.com/a"]), status: 200 };

it("verify indexnow: reports the key file served and the URL count, posting nothing", async () => {
  const { calls, fetcher } = routeFetch({
    [`GET ${KEY_FILE}`]: { body: "abcd1234-key", status: 200 },
    "GET https://example.com/sitemap.xml": sitemap,
  });

  const result = await verifyIndexNowConfig({ config, fetcher, host: "example.com" });

  expect(result).toStrictEqual({ keyFile: KEY_FILE, keyServed: true, urlCount: 2 });
  expect(calls.every((call) => call.method === "GET")).toBe(true);
});

it("verify indexnow: reports a key file that is not served", async () => {
  const { fetcher } = routeFetch({ "GET https://example.com/sitemap.xml": sitemap });
  const result = await verifyIndexNowConfig({ config, fetcher, host: "example.com" });

  expect(result.keyServed).toBe(false);
});

it("reportIndexNow prints the key file check and the URL count", () => {
  const { lines, log } = collectLines();

  reportIndexNow({ keyFile: KEY_FILE, keyServed: true, urlCount: 2 }, log);
  reportIndexNow({ keyFile: KEY_FILE, keyServed: false, urlCount: 0 }, log);

  expect(lines).toStrictEqual([
    `  Key file ${KEY_FILE}: served ✓`,
    "  Sitemap URLs: 2",
    `  Key file ${KEY_FILE}: not served ✗`,
    "  Sitemap URLs: 0",
  ]);
});
