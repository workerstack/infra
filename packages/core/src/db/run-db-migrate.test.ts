import { join } from "node:path";

import { expect, it } from "vitest";

import { testHost } from "../command/__fixtures__/test-host.ts";
import { fakeDbIo } from "./__fixtures__/fake-db-io.ts";
import { FIXTURE_ROOT, fixtureProduct } from "./__fixtures__/fixture-product.ts";
import { runDbMigrate } from "./run-db-migrate.ts";

const APPLIED = { code: 0, stderr: "", stdout: '{"applied":["0001.sql","0002.sql"],"refused":[]}\n' };

it("applies each kit database where its migrate config is, reading credentials before any spawn", async () => {
  const { calls, events, io, out } = fakeDbIo({ onSpawn: () => APPLIED });
  const { err, host } = testHost([fixtureProduct()]);

  expect(await runDbMigrate([], host, io)).toBe(0);
  expect(err).toStrictEqual([]);
  expect(events).toStrictEqual(["env", "spawn:database"]);
  expect(calls).toStrictEqual([
    {
      args: ["migrate", "apply", "main", "-e", "prod", "--yes", "--json"],
      cwd: join(FIXTURE_ROOT, "db"),
      env: { CLOUDFLARE_API_TOKEN: "token" },
      tool: "database",
    },
  ]);
  expect(out.join("\n").replace(/\d+ms/, "Nms")).toBe(
    "apps/web\n  BINDING  DATABASE  STATUS   APPLIED  TIME\n  DB       db-prod   applied  2        Nms",
  );
});

it("takes --scope dev, and exits 1 after the summary when a database fails", async () => {
  const failed = { code: 1, stderr: "boom", stdout: "" };
  const { calls, io, out } = fakeDbIo({ onSpawn: () => failed });
  const { err, host } = testHost([fixtureProduct()]);

  expect(await runDbMigrate(["--scope", "dev"], host, io)).toBe(1);
  expect(calls[0]?.args).toContain("dev");
  expect(out.join("\n")).toContain("↳ boom");
  expect(err).toStrictEqual(["infra db-migrate: apps/web: 1 of 1 databases failed"]);
});

it("prints the usage line and exits 2 for the local scope or an unknown flag, spawning nothing", async () => {
  const { events, io } = fakeDbIo();
  const { err, host } = testHost([fixtureProduct()]);

  expect(await runDbMigrate(["--scope", "local"], host, io)).toBe(2);
  expect(await runDbMigrate(["--force"], host, io)).toBe(2);
  expect(err).toStrictEqual(Array(2).fill("usage: infra db-migrate [name|--all] [--scope dev|prod]"));
  expect(events).toStrictEqual([]);
});
