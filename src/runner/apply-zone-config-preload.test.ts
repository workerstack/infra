import { expect, it } from "vitest";

import { logLines } from "../provision/__fixtures__/log-lines.ts";
import type { ZoneConfigInput } from "../schema/zone.ts";
import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { applyAnswer } from "./__fixtures__/apply-answer.ts";
import { preloadFetch } from "./__fixtures__/preload-fetch.ts";
import type { PreloadStatus } from "./__fixtures__/preload-fetch.ts";
import { zoneConfig } from "./__fixtures__/zone-config.ts";
import { applyZoneConfig } from "./apply-zone-config.ts";

const HSTS = { enabled: true, includeSubDomains: true, maxAge: 63072000, nosniff: true, preload: true };
const FORM = "https://hstspreload.org/?domain=example.com";

type Applied = { lines: string[]; urls: string[] };

async function applyWithHsts(hsts: ZoneConfigInput["ssl"], status: PreloadStatus): Promise<Applied> {
  const { client } = fakeClient(applyAnswer());
  const { lines, log } = logLines();
  const { fetcher, urls } = preloadFetch({}, status);

  await applyZoneConfig(client, zoneConfig({ ssl: hsts }), { fetcher, log });

  return { lines, urls };
}

function applyWith(status: PreloadStatus): Promise<Applied> {
  return applyWithHsts({ hsts: HSTS }, status);
}

function rejectingFetch(): Promise<Response> {
  return Promise.reject(new Error("network unreachable"));
}

it("applyZoneConfig does not call hstspreload.org when ssl.hsts.preload is false", async () => {
  const { urls } = await applyWithHsts({ hsts: { ...HSTS, preload: false } }, { status: "unknown" });

  expect(urls).toStrictEqual([]);
});

it("applyZoneConfig calls the hstspreload.org status endpoint once when preload is true", async () => {
  const { urls } = await applyWith({ status: "unknown" });

  expect(urls).toHaveLength(1);
  expect(urls[0]).toContain("/api/v2/status?domain=example.com");
});

it("applyZoneConfig logs the submission URL when the status is unknown", async () => {
  const { lines } = await applyWith({ status: "unknown" });
  const logged = lines.join("\n");

  expect(logged).toContain("not submitted");
  expect(logged).toContain(FORM);
});

it("applyZoneConfig logs a preloaded confirmation when already in the Chromium list", async () => {
  const { lines } = await applyWith({ status: "preloaded" });
  const logged = lines.join("\n");

  expect(logged).toContain("preloaded in Chromium");
  expect(logged).not.toContain("Submit manually");
});

it("applyZoneConfig logs pending status when queued", async () => {
  const { lines } = await applyWith({ status: "pending" });

  expect(lines.join("\n")).toContain("queued, awaiting next Chrome release");
});

it("applyZoneConfig logs the rejection and the resubmit URL when rejected", async () => {
  const { lines } = await applyWith({ message: "includeSubDomains missing", status: "rejected" });
  const logged = lines.join("\n");

  expect(logged).toContain("rejected");
  expect(logged).toContain("includeSubDomains missing");
  expect(logged).toContain(FORM);
});

it("applyZoneConfig does not throw when the hstspreload.org fetch fails", async () => {
  const { client } = fakeClient(applyAnswer());
  const { lines, log } = logLines();

  const applied = applyZoneConfig(client, zoneConfig({ ssl: { hsts: HSTS } }), { fetcher: rejectingFetch, log });

  await expect(applied).resolves.toBeUndefined();

  expect(lines.join("\n")).toContain("HSTS preload status check failed: network unreachable");
});
