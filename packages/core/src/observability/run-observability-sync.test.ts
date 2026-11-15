import { expect, it } from "vitest";

import { syncRun, target } from "./__fixtures__/sync-host.ts";
import { runObservabilitySync } from "./run-observability-sync.ts";

const DESIRED = { enabled: true, head_sampling_rate: 1 };
const LIVE = { enabled: true, head_sampling_rate: 0.1 };
const URL = "https://api.cloudflare.com/client/v4/accounts/acc-from-env/workers/scripts/web-api-prod/script-settings";

it("reads script-settings with the product env's account auth and reports drift", async () => {
  const { err, host, out, seen } = syncRun([target("web-api-prod", DESIRED)], [LIVE]);

  expect(await runObservabilitySync(["web-api"], host)).toBe(1);
  expect(seen).toStrictEqual([
    {
      body: undefined,
      headers: { Authorization: "Bearer tok", "Content-Type": "application/json" },
      method: "GET",
      url: URL,
    },
  ]);
  expect(out).toStrictEqual(["web-api-prod: drift\n  observability.head_sampling_rate: live 0.1 ≠ 1"]);
  expect(err).toStrictEqual([]);
});

it("with --apply patches the desired observability and reports the fields written", async () => {
  const { host, out, seen } = syncRun([target("web-api-prod", DESIRED)], [LIVE, DESIRED]);

  expect(await runObservabilitySync(["web-api", "--apply"], host)).toBe(0);
  expect(seen.map((call) => [call.method, call.url, call.body])).toStrictEqual([
    ["GET", URL, undefined],
    ["PATCH", URL, JSON.stringify({ observability: DESIRED })],
  ]);
  expect(out).toStrictEqual(["web-api-prod: applied (1 fields)"]);
});

it("falls back to the global key and email when no token is set", async () => {
  const global = { CLOUDFLARE_ACCOUNT_EMAIL: "o@x.io", CLOUDFLARE_ACCOUNT_ID: "a", CLOUDFLARE_API_KEY: "k" };
  const { host, out, seen } = syncRun([target("web-api-prod", DESIRED, global)], [DESIRED]);

  expect(await runObservabilitySync(["web-api"], host)).toBe(0);
  expect(seen[0]?.headers).toStrictEqual({
    "Content-Type": "application/json",
    "X-Auth-Email": "o@x.io",
    "X-Auth-Key": "k",
  });
  expect(out).toStrictEqual(["web-api-prod: in sync"]);
});

it("exits 1 when the PATCH leaves drift", async () => {
  const { err, host } = syncRun([target("web-api-prod", DESIRED)], [LIVE, LIVE]);

  expect(await runObservabilitySync(["web-api", "--apply"], host)).toBe(1);
  expect(err).toStrictEqual([
    "web-api-prod: still drifted after PATCH\n  observability.head_sampling_rate: live 0.1 ≠ 1",
  ]);
});

it("names a Worker whose config has no observability block", async () => {
  const { err, host, seen } = syncRun([target("web-api-prod")], []);

  expect(await runObservabilitySync(["web-api"], host)).toBe(1);
  expect(err).toStrictEqual(["web-api-prod: its config has no observability block"]);
  expect(seen).toStrictEqual([]);
});
