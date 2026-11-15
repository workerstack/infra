import { describe, expect, it } from "vitest";

import { fakePreloadFetch } from "./__fixtures__/fake-preload-fetch.ts";
import { getHstsPreloadStatus } from "./get-hsts-preload-status.ts";

describe("getHstsPreloadStatus", () => {
  it("hits the v2 status endpoint with the domain encoded", async () => {
    const { fetcher, urls } = fakePreloadFetch('{"status":"preloaded"}');

    await getHstsPreloadStatus("example.com", fetcher);

    expect(urls).toStrictEqual(["https://hstspreload.org/api/v2/status?domain=example.com"]);
  });

  it.each(["preloaded", "pending", "rejected", "unknown"] as const)("keeps the known status %s", async (status) => {
    const { fetcher } = fakePreloadFetch(JSON.stringify({ status }));

    const result = await getHstsPreloadStatus("example.com", fetcher);

    expect(result.status).toBe(status);
  });

  it("coerces an unexpected status to unknown", async () => {
    const { fetcher } = fakePreloadFetch('{"status":"queued_for_manual_review"}');

    const result = await getHstsPreloadStatus("example.com", fetcher);

    expect(result.status).toBe("unknown");
  });
});

describe("getHstsPreloadStatus results", () => {
  it("forwards the rejection message", async () => {
    const message = "Header does not include preload directive";
    const { fetcher } = fakePreloadFetch(JSON.stringify({ message, status: "rejected" }));

    expect(await getHstsPreloadStatus("example.com", fetcher)).toStrictEqual({ message, status: "rejected" });
  });

  it("throws on a non-2xx response", async () => {
    const { fetcher } = fakePreloadFetch("bad gateway", { status: 502, statusText: "Bad Gateway" });

    await expect(getHstsPreloadStatus("example.com", fetcher)).rejects.toThrow(
      "hstspreload.org status check failed: 502 Bad Gateway",
    );
  });
});
