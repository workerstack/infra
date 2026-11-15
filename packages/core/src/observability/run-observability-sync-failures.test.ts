import { expect, it } from "vitest";

import { syncRun, target } from "./__fixtures__/sync-host.ts";
import { runObservabilitySync } from "./run-observability-sync.ts";

it("prints usage and exits 2 for no Worker, an unknown flag or a bad scope", async () => {
  const { err, host } = syncRun([], []);

  expect(await runObservabilitySync([], host)).toBe(2);
  expect(await runObservabilitySync(["web-api", "--force"], host)).toBe(2);
  expect(await runObservabilitySync(["web-api", "--scope", "local"], host)).toBe(2);
  expect(err[0]).toBe("usage: infra observability-sync <worker>... [--scope prod|dev] [--apply]");
  expect(err[2]).toContain('--scope must be dev or prod, got "local"');
});

it("lists the known Workers and exits 1 for a selector that matches none", async () => {
  const { err, host } = syncRun([target("web-api-prod", { enabled: true })], []);

  expect(await runObservabilitySync(["nope"], host)).toBe(1);
  expect(err).toStrictEqual(['No worker matches "nope". Known:\n  web-api (api)']);
});

it("names the missing credential and sends nothing", async () => {
  const { err, host, seen } = syncRun([target("web-api-prod", { enabled: true }, {})], []);

  expect(await runObservabilitySync(["web-api"], host)).toBe(1);
  expect(err[0]).toContain("web-api-prod: CLOUDFLARE_ACCOUNT_EMAIL has no global value");
  expect(seen).toStrictEqual([]);
});

it("reports a failed request with the Worker and exits 1", async () => {
  const { err, host } = syncRun([target("web-api-prod", { enabled: true })], []);
  const failing = { ...host, fetcher: () => Promise.reject(new Error("network down")) };

  expect(await runObservabilitySync(["web-api"], failing)).toBe(1);
  expect(err).toStrictEqual(["infra observability-sync: web-api-prod: network down"]);
});

it("stops before any request when the guard refuses", async () => {
  const { err, host, seen } = syncRun([target("web-api-prod", { enabled: true })], []);

  const code = await runObservabilitySync(["web-api"], {
    ...host,
    guard: () => {
      throw new Error("blocked");
    },
  });

  expect(code).toBe(1);
  expect(err).toStrictEqual(["infra observability-sync: blocked"]);
  expect(seen).toStrictEqual([]);
});
