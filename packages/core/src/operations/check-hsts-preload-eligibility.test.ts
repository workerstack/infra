import { describe, expect, it } from "vitest";

import { fakePreloadFetch } from "./__fixtures__/fake-preload-fetch.ts";
import { checkHstsPreloadEligibility } from "./check-hsts-preload-eligibility.ts";

const WARNING = { code: "www_redirect", message: "www does not redirect", summary: "warn" };

describe("checkHstsPreloadEligibility", () => {
  it("hits the v2 preloadable endpoint with the domain encoded", async () => {
    const { fetcher, urls } = fakePreloadFetch('{"errors":[],"warnings":[]}');

    await checkHstsPreloadEligibility("foo bar.test", fetcher);

    expect(urls).toStrictEqual(["https://hstspreload.org/api/v2/preloadable?domain=foo%20bar.test"]);
  });

  it("reports ok when there are no errors, keeping the warnings", async () => {
    const { fetcher } = fakePreloadFetch(JSON.stringify({ errors: [], warnings: [WARNING] }));

    expect(await checkHstsPreloadEligibility("example.com", fetcher)).toStrictEqual({
      errors: [],
      ok: true,
      warnings: [WARNING],
    });
  });
});

describe("checkHstsPreloadEligibility results", () => {
  it("reports not ok when errors are present", async () => {
    const errors = [
      { code: "no_hsts", message: "Response missing HSTS header", summary: "no HSTS" },
      { code: "no_includesub", message: "includeSubDomains missing", summary: "missing directive" },
    ];

    const { fetcher } = fakePreloadFetch(JSON.stringify({ errors, warnings: [] }));
    const result = await checkHstsPreloadEligibility("broken.test", fetcher);

    expect(result.ok).toBe(false);
    expect(result.errors).toStrictEqual(errors);
  });

  it("throws on a non-2xx response", async () => {
    const { fetcher } = fakePreloadFetch("service down", { status: 503, statusText: "Service Unavailable" });

    await expect(checkHstsPreloadEligibility("example.com", fetcher)).rejects.toThrow(
      "hstspreload.org preloadable check failed: 503 Service Unavailable",
    );
  });
});
