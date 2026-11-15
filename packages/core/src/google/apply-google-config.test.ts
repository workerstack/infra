import { expect, it } from "vitest";

import { collectLines } from "./__fixtures__/collect-lines.ts";
import { googleFetch } from "./__fixtures__/google-fetch.ts";
import { googleConfig, googleEnv, googlePrivateKey } from "./__fixtures__/google-fixtures.ts";
import { applyGoogleConfig } from "./apply-google-config.ts";

const SITEMAP =
  "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aexample.com/sitemaps/" +
  "https%3A%2F%2Fexample.com%2Fsitemap.xml";

it("apply google: prints the OAuth lines and PUTs each sitemap with a Bearer token", async () => {
  const { lines, log } = collectLines();
  const { calls, fetcher } = googleFetch(200, {});

  await applyGoogleConfig({ config: googleConfig, env: googleEnv(await googlePrivateKey()), fetcher, log });

  expect(lines).toStrictEqual([
    "  OAuth:",
    "    [prod] Client ID: 123456…nt.com ✓",
    "    [prod] Auth URL: https://accounts.google.com/o/oauth2/v2/auth",
    "    [prod] Redirect origins: https://example.com",
    '  Sitemap "https://example.com/sitemap.xml" ...',
    "    → submitted",
  ]);
  expect(calls[1]?.url).toBe(SITEMAP);
  expect(calls[1]?.init.method).toBe("PUT");
  expect(calls[1]?.init.headers).toStrictEqual({ Authorization: "Bearer tok1" });
});

it("apply google: prints the failure of a rejected sitemap", async () => {
  const { lines, log } = collectLines();
  const { fetcher } = googleFetch(403, {});
  const config = { searchConsole: googleConfig.searchConsole };

  await applyGoogleConfig({ config, env: googleEnv(await googlePrivateKey()), fetcher, log });

  expect(lines.at(-1)).toBe("    → Sitemap submit failed (403)");
});

it("apply google: marks empty and malformed client ids and masks short ones whole", async () => {
  const { lines, log } = collectLines();

  const oauth = {
    dev: { authBaseUrl: "u", clientId: "", redirectOrigins: [] },
    prod: { authBaseUrl: "u", clientId: "short", redirectOrigins: [] },
  };

  await applyGoogleConfig({ config: { oauth }, env: googleEnv(undefined), log });

  expect(lines).toContain("    [dev] Client ID: (empty) (empty)");
  expect(lines).toContain("    [prod] Client ID: ••••• ✗ invalid format");
});

it("apply google: skips Search Console when the email is empty", async () => {
  const { lines, log } = collectLines();
  const searchConsole = { serviceAccountEmail: "", siteUrl: "x", sitemapUrls: [] };

  await applyGoogleConfig({ config: { searchConsole }, env: googleEnv(undefined), log });

  expect(lines).toStrictEqual(["  Search Console: (credentials empty, skipping)"]);
});

it("apply google: throws the fix line when the global private key is missing", async () => {
  const { log } = collectLines();
  const run = applyGoogleConfig({ config: googleConfig, env: googleEnv(undefined), log });

  await expect(run).rejects.toThrow("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY has no global value");
});
