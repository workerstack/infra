import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { okBody } from "../api/__fixtures__/fake-fetch.ts";
import { fakeInfraEnv } from "../shared/__fixtures__/fake-infra-env.ts";
import { cleanRoots, fakeLogs } from "./__fixtures__/fake-logs-host.ts";
import { fakeQueryDeps, NOW } from "./__fixtures__/fake-query-deps.ts";
import { runLogsQuery } from "./run-logs-query.ts";

const FAILING = {
  $metadata: { level: "error", message: "POST /v1/x" },
  $workers: { event: { response: { status: 500 } }, outcome: "ok", wallTimeMs: 12 },
  timestamp: Date.UTC(2026, 0, 2, 3, 4, 5, 6),
};

afterEach(cleanRoots);

it("posts the telemetry query to the product env's account with its auth headers", async () => {
  const logs = fakeLogs();
  const { deps, fetch } = fakeQueryDeps(okBody({ events: { events: [] } }));

  expect(await runLogsQuery(["web-api", "--errors"], logs.host, deps)).toBe(0);
  expect(fetch.calls).toHaveLength(1);
  expect(fetch.calls[0]?.url).toBe(
    "https://api.cloudflare.com/client/v4/accounts/acct-1/workers/observability/telemetry/query",
  );
  expect(fetch.calls[0]?.init.method).toBe("POST");
  expect(fetch.calls[0]?.init.headers).toStrictEqual({
    "Content-Type": "application/json",
    "X-Auth-Email": "me@example.test",
    "X-Auth-Key": "key-1",
  });
  expect(JSON.parse(fetch.calls[0]?.init.body /* the client sends JSON text */ as string)).toMatchObject({
    limit: 50,
    timeframe: { from: NOW - 3_600_000, to: NOW },
    view: "events",
  });
});

it("uses each Worker's own product env", async () => {
  const token = fakeInfraEnv({
    global: {
      CLOUDFLARE_ACCOUNT_EMAIL: "e",
      CLOUDFLARE_ACCOUNT_ID: "acct-2",
      CLOUDFLARE_API_KEY: "k",
      CLOUDFLARE_API_TOKEN: "tok-2",
    },
  });

  const logs = fakeLogs({ docs: token });
  const { deps, fetch } = fakeQueryDeps(okBody({}));

  await runLogsQuery(["docs-site", "web-api"], logs.host, deps);

  expect(fetch.calls.map((call) => call.url.split("/")[6])).toStrictEqual(["acct-2", "acct-1"]);
  expect(fetch.calls[0]?.init.headers).toMatchObject({ Authorization: "Bearer tok-2" });
});

it("dumps the full result and prints a heading and one line per row", async () => {
  const logs = fakeLogs();
  const { deps } = fakeQueryDeps(okBody({ events: { events: [FAILING] }, statistics: { abr_level: 4 } }));

  expect(await runLogsQuery(["web-api"], logs.host, deps)).toBe(0);

  const dir = join(logs.root, ".tmp/infra/query");
  const [file] = readdirSync(dir);

  expect(file).toMatch(/-web-api-prod-events\.json$/);
  expect(logs.out[0]).toBe(`## web-api-prod events last 60m: 1 rows → .tmp/infra/query/${file}`);
  expect(logs.out[1]).toContain("! sampled (abr_level 4)");
  expect(logs.out[2]).toBe("01-02T03:04:05.006 error ok 500 wall=12ms POST /v1/x");
  expect(JSON.parse(readFileSync(join(dir, file ?? ""), "utf8"))).toMatchObject({ statistics: { abr_level: 4 } });
});

it("names the Worker whose query failed, exits 1 and tries the next", async () => {
  const logs = fakeLogs();
  const { deps, fetch } = fakeQueryDeps({ errors: [{ message: "bad query" }], success: false });

  expect(await runLogsQuery(["web-api", "docs-site"], logs.host, deps)).toBe(1);
  expect(fetch.calls).toHaveLength(2);
  expect(logs.err[0]).toContain(
    "web-api-prod: CF API POST /accounts/acct-1/workers/observability/telemetry/query: bad query",
  );
});

it("names the missing credential and sends no request", async () => {
  const logs = fakeLogs({ web: fakeInfraEnv() });
  const { deps, fetch } = fakeQueryDeps(okBody({}));

  expect(await runLogsQuery(["docs-site", "web-api"], logs.host, deps)).toBe(1);
  expect(logs.err).toStrictEqual([
    "infra logs-query: CLOUDFLARE_ACCOUNT_ID has no global value; " +
      "run bun repo env set CLOUDFLARE_ACCOUNT_ID --scope global",
  ]);
  expect(fetch.calls).toHaveLength(0);
});

it("lists the known Workers for a selector that matches none, and prints the usage for bad arguments", async () => {
  const logs = fakeLogs();
  const { deps } = fakeQueryDeps(okBody({}));

  expect(await runLogsQuery(["nope"], logs.host, deps)).toBe(1);
  expect(logs.err[0]).toContain('No worker matches "nope". Known:');
  expect(await runLogsQuery(["web-api", "--view", "logs"], logs.host, deps)).toBe(2);
  expect(await runLogsQuery([], logs.host, deps)).toBe(2);
  expect(logs.err[1]).toContain("--view must be one of events, invocations, traces, calculations.");
});
