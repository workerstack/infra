import { afterEach, expect, it } from "vitest";

import { fakeInfraEnv } from "../shared/__fixtures__/fake-infra-env.ts";
import { cleanRoots, fakeLogs } from "./__fixtures__/fake-logs-host.ts";
import { fakeTailSpawn } from "./__fixtures__/fake-tail-spawn.ts";
import { tailDepsOf } from "./__fixtures__/tail-deps-of.ts";
import { runLogsTail } from "./run-logs-tail.ts";

afterEach(cleanRoots);

it("lists the known Workers and exits 1 when no Worker matches", async () => {
  const logs = fakeLogs();
  const fake = fakeTailSpawn({});

  expect(await runLogsTail(["nope"], logs.host, tailDepsOf(fake.spawn))).toBe(1);
  expect(logs.err).toStrictEqual([
    'No worker matches "nope". Known:\n  docs-site (apps/docs/worker)\n  web-api (apps/web/api)',
  ]);
  expect(fake.launches).toHaveLength(0);
});

it("names the missing credential and starts no child", async () => {
  const logs = fakeLogs({ docs: fakeInfraEnv() });
  const fake = fakeTailSpawn({});

  expect(await runLogsTail(["web-api", "docs-site"], logs.host, tailDepsOf(fake.spawn))).toBe(1);
  expect(logs.err[0]).toContain("infra logs-tail: CLOUDFLARE_ACCOUNT_EMAIL has no global value");
  expect(fake.launches).toHaveLength(0);
});

it("prints the usage and exits 2 for no Worker, a bad scope, bad minutes and an unknown flag", async () => {
  const logs = fakeLogs();
  const deps = tailDepsOf(fakeTailSpawn({}).spawn);

  expect(await runLogsTail([], logs.host, deps)).toBe(2);
  expect(await runLogsTail(["web-api", "--scope", "local"], logs.host, deps)).toBe(2);
  expect(await runLogsTail(["web-api", "--minutes", "-1"], logs.host, deps)).toBe(2);
  expect(await runLogsTail(["web-api", "--format", "pretty"], logs.host, deps)).toBe(2);
  expect(logs.err[0]).toContain("Pass at least one worker selector.");
  expect(logs.err[1]).toContain('--scope must be dev or prod, got "local".');
  expect(logs.err[0]).toContain("usage: infra logs-tail <worker>...");
});

it("prints the usage on stdout for --help", async () => {
  const logs = fakeLogs();

  expect(await runLogsTail(["--help"], logs.host, tailDepsOf(fakeTailSpawn({}).spawn))).toBe(0);
  expect(logs.out.join("\n")).toContain("--minutes 0 tails until killed");
});

it("reports the guard's line and exits 1", async () => {
  const logs = fakeLogs();

  const guarded = {
    ...logs.host,
    guard: () => {
      throw new Error("refusing the account's cloud credentials under a test runner");
    },
  };

  expect(await runLogsTail(["web-api"], guarded, tailDepsOf(fakeTailSpawn({}).spawn))).toBe(1);
  expect(logs.err[0]).toBe("infra logs-tail: refusing the account's cloud credentials under a test runner");
});
