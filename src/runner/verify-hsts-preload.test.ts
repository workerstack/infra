import { expect, it } from "vitest";

import { preloadFetch } from "./__fixtures__/preload-fetch.ts";
import { verifyHstsPreload } from "./verify-hsts-preload.ts";

const ISSUE_ERROR = { code: "no_hsts", message: "no HSTS header", summary: "missing" };
const ISSUE_WARNING = { code: "www_redirect", message: "www does not redirect", summary: "warn" };

it("verifyHstsPreload returns ok when hstspreload.org reports no errors", async () => {
  const { fetcher } = preloadFetch({ errors: [], warnings: [] }, { status: "preloaded" });

  const result = await verifyHstsPreload("example.com", fetcher);

  expect(result.eligibility.ok).toBe(true);
  expect(result.eligibility.errors).toStrictEqual([]);
  expect(result.status.status).toBe("preloaded");
});

it("verifyHstsPreload propagates errors and warnings from preloadable", async () => {
  const { fetcher } = preloadFetch({ errors: [ISSUE_ERROR], warnings: [ISSUE_WARNING] }, { status: "unknown" });

  const result = await verifyHstsPreload("broken.test", fetcher);

  expect(result.eligibility.ok).toBe(false);
  expect(result.eligibility.errors[0]?.code).toBe("no_hsts");
  expect(result.eligibility.warnings[0]?.code).toBe("www_redirect");
});

it("verifyHstsPreload fires both checks", async () => {
  const { fetcher, urls } = preloadFetch({ errors: [], warnings: [] }, { status: "pending" });

  await verifyHstsPreload("example.com", fetcher);

  expect(urls).toHaveLength(2);
  expect(urls.some((url) => url.includes("/preloadable?domain=example.com"))).toBe(true);
  expect(urls.some((url) => url.includes("/status?domain=example.com"))).toBe(true);
});
