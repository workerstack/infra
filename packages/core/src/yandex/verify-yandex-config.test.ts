import { expect, it } from "vitest";

import { collectLines } from "../google/__fixtures__/collect-lines.ts";
import { fakeInfraEnv } from "../shared/__fixtures__/fake-infra-env.ts";
import { yandexRoutes } from "./__fixtures__/yandex-routes.ts";
import { reportYandex } from "./report-yandex.ts";
import { verifyYandexConfig } from "./verify-yandex-config.ts";

const env = fakeInfraEnv({ global: { YANDEX_WEBMASTER_TOKEN: "ytok" } });
const A = "https://example.com/sitemap.xml";
const B = "https://example.com/blog/sitemap.xml";
const config = { webmaster: { sitemapUrls: [A, B] } };

it("verify yandex: reports each sitemap added or missing, adding nothing", async () => {
  const { calls, fetcher } = yandexRoutes({ sitemaps: [{ sitemap_id: "s1", sitemap_url: A }] });
  const result = await verifyYandexConfig({ config, env, fetcher, hostUrl: "https://example.com" });

  expect(result).toStrictEqual({
    hostUrl: "https://example.com/",
    sitemaps: [
      { added: true, url: A },
      { added: false, url: B },
    ],
  });
  expect(calls.every((call) => call.method === "GET")).toBe(true);
});

it("reportYandex prints the host and each sitemap", () => {
  const { lines, log } = collectLines();

  reportYandex(
    {
      hostUrl: "https://example.com/",
      sitemaps: [
        { added: true, url: A },
        { added: false, url: B },
      ],
    },
    log,
  );

  expect(lines).toStrictEqual([
    "  Host https://example.com/: verified ✓",
    "  Sitemaps:",
    `    ${A}: added ✓`,
    `    ${B}: missing ✗`,
  ]);
});
