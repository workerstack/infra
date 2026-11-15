import { expect, it } from "vitest";

import { cloudflareConfig } from "../runner/__fixtures__/cloudflare-config.ts";
import { fakeInfraEnv } from "../shared/__fixtures__/fake-infra-env.ts";
import { product, testHost } from "./__fixtures__/test-host.ts";
import type { GetDeps } from "./get-deps.ts";
import { runGet } from "./run-get.ts";

function deps(lines: string[]): GetDeps {
  return {
    client: () => ({ request: () => Promise.reject(new Error("unused")), zoneId: "zid" }),
    getCloudflare: (_client, target) => {
      lines.push(`cloudflare ${target.name} ${target.accountId}`);

      return Promise.resolve();
    },
    log: (line) => lines.push(line),
    verifyApple: () => Promise.resolve({ jwksReachable: true, oauth: [] }),
    verifyGithub: () => Promise.resolve({ oauth: [] }),
    verifyGoogle: () => Promise.resolve({ oauth: [] }),
    verifyIndexNow: (target) =>
      Promise.resolve({ keyFile: `https://${target.host}/k.txt`, keyServed: true, urlCount: 2 }),
    verifyMicrosoft: () => Promise.resolve({ oauth: [] }),
    verifyYandex: (target) => Promise.resolve({ hostUrl: target.hostUrl, sitemaps: [] }),
  };
}

it("get reports Cloudflare, then Google, Apple, Microsoft and GitHub under their headings", async () => {
  const lines: string[] = [];
  const web = product("apps/web", { apple: {}, cloudflare: cloudflareConfig(), github: {}, google: {}, microsoft: {} });
  const { host, out } = testHost([web]);

  expect(await runGet([], host, deps(lines))).toBe(0);
  expect(lines).toStrictEqual([
    "cloudflare apps/web acc",
    "\n Google: apps/web",
    "\n Apple: apps/web",
    "  JWKS endpoint: reachable ✓",
    "\n Microsoft: apps/web",
    "\n GitHub: apps/web",
  ]);
  expect(out).toStrictEqual(["\n Verification complete."]);
});

it("get names the missing account id for a product that lacks it", async () => {
  const bare = { ...product("apps/web", { cloudflare: cloudflareConfig() }) };
  const config = { ...bare.config, env: fakeInfraEnv() };
  const { err, host } = testHost([{ ...bare, config }]);

  expect(await runGet([], host, deps([]))).toBe(1);
  expect(err).toStrictEqual([
    "infra get: apps/web: CLOUDFLARE_ACCOUNT_ID has no global value; " +
      "run bun repo env set CLOUDFLARE_ACCOUNT_ID --scope global",
  ]);
});

it("get reports IndexNow and Yandex after GitHub, defaulting their hosts to the zone domain", async () => {
  const lines: string[] = [];
  const indexNow = { key: "abcd1234-key", sitemapUrls: [] };
  const yandex = { webmaster: { sitemapUrls: [] } };
  const web = product("apps/web", { cloudflare: cloudflareConfig(), github: {}, indexNow, yandex });

  expect(await runGet([], testHost([web]).host, deps(lines))).toBe(0);
  expect(lines.slice(1)).toStrictEqual([
    "\n GitHub: apps/web",
    "\n IndexNow: apps/web",
    "  Key file https://example.com/k.txt: served ✓",
    "  Sitemap URLs: 2",
    "\n Yandex: apps/web",
    "  Host https://example.com: verified ✓",
  ]);
});

it("get fails an IndexNow product with no host and no zone", async () => {
  const web = product("apps/web", { indexNow: { key: "abcd1234-key", sitemapUrls: [] } });
  const { err, host } = testHost([web]);

  expect(await runGet([], host, deps([]))).toBe(1);
  expect(err).toStrictEqual([
    "infra get: apps/web: indexNow.host is unset and there is no cloudflare.zone.domain to default to",
  ]);
});
