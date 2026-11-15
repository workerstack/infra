import { expect, it } from "vitest";

import { collectLines } from "../google/__fixtures__/collect-lines.ts";
import { type RouteAnswer, type RouteCall, routeFetch } from "./__fixtures__/route-fetch.ts";
import { sitemapXml } from "./__fixtures__/sitemap-xml.ts";
import { applyIndexNowConfig } from "./apply-index-now-config.ts";

const { log: quiet } = collectLines();

const KEY = "abcd1234-key";
const KEY_FILE = `https://example.com/${KEY}.txt`;
const API = "POST https://api.indexnow.org/indexnow";
const config = { key: KEY, sitemapUrls: ["https://example.com/sitemap.xml"] };

function sitemap(urls: string[]): RouteAnswer {
  return { body: sitemapXml(urls), status: 200 };
}

function routes(extra: Record<string, RouteAnswer | ((call: RouteCall) => RouteAnswer)>) {
  return routeFetch({
    [API]: { body: "", status: 200 },
    [`GET ${KEY_FILE}`]: { body: `${KEY}\n`, status: 200 },
    "GET https://example.com/sitemap.xml": sitemap(["https://example.com/", "https://example.com/a"]),
    ...extra,
  });
}

it("apply indexnow: checks the key file, then POSTs the sitemap URLs as JSON", async () => {
  const { lines, log } = collectLines();
  const { calls, fetcher } = routes({});

  await applyIndexNowConfig({ config, fetcher, host: "example.com", log });

  expect(calls.map((call) => `${call.method} ${call.url}`)).toStrictEqual([
    `GET ${KEY_FILE}`,
    "GET https://example.com/sitemap.xml",
    API,
  ]);
  expect(calls[2]?.init.headers).toStrictEqual({ "Content-Type": "application/json; charset=utf-8" });
  expect(JSON.parse(calls[2]?.body ?? "")).toStrictEqual({
    host: "example.com",
    key: KEY,
    keyLocation: KEY_FILE,
    urlList: ["https://example.com/", "https://example.com/a"],
  });
  expect(lines).toStrictEqual([
    `  Key file ${KEY_FILE}: served`,
    "  Sitemaps: 2 URLs on example.com",
    "  POST 2 URLs → 200 ok",
  ]);
});

const NOT_SERVED = `indexNow: ${KEY_FILE} does not serve the key; serve a file there that holds it`;

it("apply indexnow: fails when the key file is missing", async () => {
  const { calls, fetcher } = routes({ [`GET ${KEY_FILE}`]: { body: "nope", status: 404 } });

  await expect(applyIndexNowConfig({ config, fetcher, host: "example.com", log: quiet })).rejects.toThrow(NOT_SERVED);
  expect(calls).toHaveLength(1);
});

it("apply indexnow: fails when the key file holds something else", async () => {
  const { fetcher } = routes({ [`GET ${KEY_FILE}`]: { body: "other-key", status: 200 } });

  await expect(applyIndexNowConfig({ config, fetcher, host: "example.com", log: quiet })).rejects.toThrow(NOT_SERVED);
});

it("apply indexnow: follows a sitemap index one level and drops off-host URLs", async () => {
  const { calls, fetcher } = routes({
    "GET https://example.com/s1.xml": sitemap(["https://example.com/one", "https://other.com/x"]),
    "GET https://example.com/s2.xml": sitemap(["https://example.com/two", "https://example.com/one"]),
    "GET https://example.com/sitemap.xml": {
      body: sitemapXml(["https://example.com/s1.xml", "https://example.com/s2.xml"], true),
      status: 200,
    },
  });

  await applyIndexNowConfig({ config, fetcher, host: "example.com", log: quiet });

  const body = JSON.parse(calls.at(-1)?.body ?? "") /* the POST body is the IndexNow JSON */ as { urlList: string[] };

  expect(body.urlList).toStrictEqual(["https://example.com/one", "https://example.com/two"]);
});

it("apply indexnow: fails naming a sitemap that does not answer", async () => {
  const { fetcher } = routes({ "GET https://example.com/sitemap.xml": { body: "", status: 500 } });
  const run = applyIndexNowConfig({ config, fetcher, host: "example.com", log: quiet });

  await expect(run).rejects.toThrow("indexNow: sitemap https://example.com/sitemap.xml answered 500");
});

it("apply indexnow: POSTs at most 10,000 URLs at a time", async () => {
  const urls = Array.from({ length: 10_001 }, (_, i) => `https://example.com/p${String(i)}`);
  const { lines, log } = collectLines();
  const { calls, fetcher } = routes({ "GET https://example.com/sitemap.xml": sitemap(urls) });

  await applyIndexNowConfig({ config, fetcher, host: "example.com", log });

  const posts = calls.filter((call) => call.method === "POST");

  const sizes = posts.map(
    (call) => (JSON.parse(call.body) /* the POST body is the IndexNow JSON */ as { urlList: string[] }).urlList.length,
  );

  expect(sizes).toStrictEqual([10_000, 1]);
  expect(lines.slice(-2)).toStrictEqual(["  POST 10000 URLs → 200 ok", "  POST 1 URLs → 200 ok"]);
});

it("apply indexnow: skips the POST when the sitemaps hold no URL on the host", async () => {
  const { calls, fetcher } = routes({ "GET https://example.com/sitemap.xml": sitemap(["https://other.com/"]) });

  await applyIndexNowConfig({ config, fetcher, host: "example.com", log: quiet });

  expect(calls.filter((call) => call.method === "POST")).toHaveLength(0);
});

it.each([
  [202, "key pending"],
  [200, "ok"],
])("apply indexnow: logs %i as %s and passes", async (status, meaning) => {
  const { lines, log } = collectLines();
  const { fetcher } = routes({ [API]: { body: "", status } });

  await applyIndexNowConfig({ config, fetcher, host: "example.com", log });

  expect(lines.at(-1)).toBe(`  POST 2 URLs → ${String(status)} ${meaning}`);
});

it.each([
  [400, "bad format"],
  [403, "bad key"],
  [422, "off-host urls"],
  [429, "too many"],
  [500, "unexpected"],
])("apply indexnow: logs %i as %s and fails", async (status, meaning) => {
  const { lines, log } = collectLines();
  const { fetcher } = routes({ [API]: { body: "", status } });
  const run = applyIndexNowConfig({ config, fetcher, host: "example.com", log });

  await expect(run).rejects.toThrow(`indexNow: IndexNow answered ${String(status)} (${meaning})`);
  expect(lines.at(-1)).toBe(`  POST 2 URLs → ${String(status)} ${meaning}`);
});

it("apply indexnow: posts to an overridden API URL", async () => {
  const { calls, fetcher } = routes({ "POST http://127.0.0.1:9/indexnow": { body: "", status: 200 } });

  await applyIndexNowConfig({
    apiUrl: "http://127.0.0.1:9/indexnow",
    config,
    fetcher,
    host: "example.com",
    log: quiet,
  });

  expect(calls.at(-1)?.url).toBe("http://127.0.0.1:9/indexnow");
});
