import { expect, it } from "vitest";

import { collectLines } from "../google/__fixtures__/collect-lines.ts";
import { fakeInfraEnv } from "../shared/__fixtures__/fake-infra-env.ts";
import { YANDEX_SITEMAPS, yandexRoutes } from "./__fixtures__/yandex-routes.ts";
import { applyYandexConfig } from "./apply-yandex-config.ts";

const { log: quiet } = collectLines();

const env = fakeInfraEnv({ global: { YANDEX_WEBMASTER_TOKEN: "ytok" } });
const A = "https://example.com/sitemap.xml";
const B = "https://example.com/blog/sitemap.xml";
const config = { webmaster: { sitemapUrls: [A, B] } };

it("apply yandex: finds the user and host, then adds only the missing sitemap", async () => {
  const { lines, log } = collectLines();
  const { calls, fetcher } = yandexRoutes({ sitemaps: [{ sitemap_id: "s1", sitemap_url: A }] });

  await applyYandexConfig({ config, env, fetcher, hostUrl: "https://example.com", log });

  expect(calls.map((call) => `${call.method} ${call.url}`)).toStrictEqual([
    "GET https://api.webmaster.yandex.net/v4/user",
    "GET https://api.webmaster.yandex.net/v4/user/42/hosts",
    `GET ${YANDEX_SITEMAPS}`,
    `POST ${YANDEX_SITEMAPS}`,
  ]);
  expect(calls[0]?.init.headers).toStrictEqual({ Authorization: "OAuth ytok" });
  expect(JSON.parse(calls[3]?.body ?? "")).toStrictEqual({ url: B });
  expect(lines).toStrictEqual([
    "  Host https://example.com/: verified",
    `  Sitemap "${A}" → already added`,
    `  Sitemap "${B}" → added`,
  ]);
});

it("apply yandex: a rerun with every sitemap there adds none", async () => {
  const sitemaps = [
    { sitemap_id: "s1", sitemap_url: A },
    { sitemap_id: "s2", sitemap_url: B },
  ];

  const { calls, fetcher } = yandexRoutes({ sitemaps });

  await applyYandexConfig({ config, env, fetcher, hostUrl: "https://example.com/", log: quiet });

  expect(calls.filter((call) => call.method === "POST")).toHaveLength(0);
});

it("apply yandex: fails naming a host Webmaster does not have", async () => {
  const { fetcher } = yandexRoutes({ hosts: [] });
  const run = applyYandexConfig({ config, env, fetcher, hostUrl: "https://example.com" });

  await expect(run).rejects.toThrow(
    "yandex: host https://example.com/ is not in Yandex Webmaster; add it there and verify it",
  );
});

it("apply yandex: fails naming a host that is not verified", async () => {
  const hosts = [{ ascii_host_url: "https://example.com/", host_id: "https:example.com:443", verified: false }];
  const { fetcher } = yandexRoutes({ hosts });
  const run = applyYandexConfig({ config, env, fetcher, hostUrl: "https://example.com" });

  await expect(run).rejects.toThrow("yandex: host https://example.com/ is not verified in Yandex Webmaster");
});

it("apply yandex: fails naming the call the API rejects", async () => {
  const run = applyYandexConfig({
    config,
    env,
    fetcher: () => Promise.resolve(new Response("{}", { status: 401 })),
    hostUrl: "https://example.com",
  });

  await expect(run).rejects.toThrow("yandex: GET /user answered 401");
});

it("apply yandex: throws the fix line when the global token is missing", async () => {
  const { fetcher } = yandexRoutes({});
  const run = applyYandexConfig({ config, env: fakeInfraEnv(), fetcher, hostUrl: "https://example.com" });

  await expect(run).rejects.toThrow(
    "YANDEX_WEBMASTER_TOKEN has no global value; run bun repo env set YANDEX_WEBMASTER_TOKEN --scope global",
  );
});

it("apply yandex: calls an overridden API base", async () => {
  const { calls, fetcher } = yandexRoutes({});
  const run = applyYandexConfig({ apiBase: "http://127.0.0.1:9/v4", config, env, fetcher, hostUrl: "https://e.com" });

  await expect(run).rejects.toThrow("yandex: GET /user answered 404");
  expect(calls[0]?.url).toBe("http://127.0.0.1:9/v4/user");
});
