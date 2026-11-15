import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, expect, it, vi } from "vitest";

import { wranglerEnv } from "../wrangler-env.ts";
import { ACCOUNT_ENV, cleanRoots, fakeLogs } from "./__fixtures__/fake-logs-host.ts";
import { fakeTailSpawn } from "./__fixtures__/fake-tail-spawn.ts";
import { tailDepsOf } from "./__fixtures__/tail-deps-of.ts";
import { runLogsTail } from "./run-logs-tail.ts";

const EVENT = JSON.stringify(
  { eventTimestamp: Date.UTC(2026, 0, 1, 12), outcome: "ok", scriptName: "web-api-prod", wallTime: 3 },
  null,
  2,
);

afterEach(() => {
  cleanRoots();
  vi.useRealTimers();
});

it("spawns wrangler tail for the script as json under the product env's wrangler env", async () => {
  const logs = fakeLogs();
  const fake = fakeTailSpawn({ "web-api-prod": {} });

  expect(await runLogsTail(["web-api"], logs.host, tailDepsOf(fake.spawn))).toBe(0);
  expect(fake.launches).toHaveLength(1);
  expect(fake.launches[0]?.args).toStrictEqual(["wrangler.js", "tail", "web-api-prod", "--format", "json"]);
  expect(fake.launches[0]?.env).toStrictEqual(wranglerEnv(ACCOUNT_ENV, {}));
  expect(fake.launches[0]?.cwd).toBe(logs.root);
});

it("prints one summary line per event and keeps the full event in the dump", async () => {
  const logs = fakeLogs();
  const fake = fakeTailSpawn({ "web-api-prod": { stdout: [EVENT.slice(0, 20), EVENT.slice(20)] } });

  expect(await runLogsTail(["web-api"], logs.host, tailDepsOf(fake.spawn))).toBe(0);

  const [file] = readdirSync(join(logs.root, ".tmp/infra/tail"));

  expect(logs.out[0]).toMatch(/^tail web-api-prod \(15m\) → \.tmp\/infra\/tail\/.+-prod\.ndjson$/);
  expect(logs.out[1]).toBe("12:00:00.000 web-api-prod ok - event wall=3ms");
  expect(JSON.parse(readFileSync(join(logs.root, ".tmp/infra/tail", file ?? ""), "utf8"))).toMatchObject({
    wallTime: 3,
  });
});

it("runs one child per Worker and forwards the wrangler filters", async () => {
  const logs = fakeLogs();
  const fake = fakeTailSpawn({});

  await runLogsTail(["web-api", "docs-site", "--scope", "dev", "--status", "error"], logs.host, tailDepsOf(fake.spawn));

  expect(fake.launches.map((launch) => launch.args.slice(1, 3))).toStrictEqual([
    ["tail", "web-api-dev"],
    ["tail", "docs-site-dev"],
  ]);
  expect(fake.launches[0]?.args.slice(-2)).toStrictEqual(["--status", "error"]);
  expect(logs.out[0]).toMatch(/^tail web-api-dev, docs-site-dev \(15m\)/);
});

it("kills every child when the minutes pass and exits 0", async () => {
  vi.useFakeTimers();

  const logs = fakeLogs();
  const fake = fakeTailSpawn({ "docs-site-prod": { hangs: true }, "web-api-prod": { hangs: true } });
  const done = runLogsTail(["apps/web", "docs-site", "--minutes", "2"], logs.host, tailDepsOf(fake.spawn));

  await vi.advanceTimersByTimeAsync(120_000);

  expect(await done).toBe(0);
  expect(fake.killed.toSorted()).toStrictEqual(["docs-site-prod", "web-api-prod"]);
});

it("kills the children on an interrupt, also with --minutes 0", async () => {
  const logs = fakeLogs();
  const fake = fakeTailSpawn({ "web-api-prod": { hangs: true } });
  const done = runLogsTail(["web-api", "--minutes", "0"], logs.host, tailDepsOf(fake.spawn));

  await vi.waitFor(() => expect(fake.launches).toHaveLength(1));
  logs.interrupt();

  expect(await done).toBe(0);
  expect(logs.out[0]).toContain("(until killed)");
});

it("prints a child's stderr with its script and exits 1 when it fails unprompted", async () => {
  const logs = fakeLogs();
  const fake = fakeTailSpawn({ "web-api-prod": { exit: 3, stderr: " not logged in \n" } });

  expect(await runLogsTail(["web-api"], logs.host, tailDepsOf(fake.spawn))).toBe(1);
  expect(logs.err).toStrictEqual(["[web-api-prod] not logged in"]);
});
