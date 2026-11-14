import { expect, it } from "vitest";

import { googleFetch } from "./__fixtures__/google-fetch.ts";
import { googleConfig, googleEnv, googlePrivateKey } from "./__fixtures__/google-fixtures.ts";
import { verifyGoogleConfig } from "./verify-google-config.ts";

const SITE = "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aexample.com";
const TOKEN = "https://oauth2.googleapis.com/token";

const KEY_FIX =
  "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY has no global value; " +
  "run bun repo env set GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY --scope global";

const sitemap = { lastSubmitted: "t1", path: "https://example.com/sitemap.xml" };

const oauth = {
  authBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  clientIdValid: true,
  env: "prod",
  redirectOrigins: ["https://example.com"],
};

it("verify google: checks the client id and lists the sitemaps of a visible site", async () => {
  const { calls, fetcher } = googleFetch(200, { permissionLevel: "siteOwner", sitemap: [sitemap] });
  const env = googleEnv(await googlePrivateKey());
  const result = await verifyGoogleConfig({ config: googleConfig, env, fetcher });

  expect(result).toStrictEqual({ oauth: [oauth], searchConsole: { siteVerified: true, sitemaps: [sitemap] } });
  expect(calls.map((call) => call.url)).toStrictEqual([TOKEN, SITE, TOKEN, `${SITE}/sitemaps`]);
  expect(calls[1]?.init.headers).toStrictEqual({ Authorization: "Bearer tok1" });
});

it("verify google: reports an unverified site without listing sitemaps", async () => {
  const { calls, fetcher } = googleFetch(403, {});
  const env = googleEnv(await googlePrivateKey());
  const result = await verifyGoogleConfig({ config: googleConfig, env, fetcher });

  expect(result.searchConsole).toStrictEqual({ siteVerified: false, sitemaps: [] });
  expect(calls).toHaveLength(2);
});

it("verify google: flags a client id with the wrong format", async () => {
  const { fetcher } = googleFetch(200, {});
  const config = { oauth: { dev: { authBaseUrl: "u", clientId: "nope", redirectOrigins: [] } } };
  const result = await verifyGoogleConfig({ config, env: googleEnv(undefined), fetcher });

  expect(result.oauth[0]?.clientIdValid).toBe(false);
});

it("verify google: skips Search Console when the service account email is empty", async () => {
  const { calls, fetcher } = googleFetch(200, {});
  const searchConsole = { serviceAccountEmail: "", siteUrl: "sc-domain:example.com", sitemapUrls: [] };
  const result = await verifyGoogleConfig({ config: { searchConsole }, env: googleEnv(undefined), fetcher });

  expect(result.searchConsole).toStrictEqual({ siteVerified: false, sitemaps: [] });
  expect(calls).toHaveLength(0);
});

it("verify google: throws the fix line when the global private key is missing", async () => {
  const { fetcher } = googleFetch(200, {});
  const run = verifyGoogleConfig({ config: googleConfig, env: googleEnv(undefined), fetcher });

  await expect(run).rejects.toThrow(KEY_FIX);
});
