import { join } from "node:path";

import { expect, it } from "vitest";

import { fixtureConfig, fixtureEnv } from "../cf-kit/__fixtures__/kit-fixtures.ts";
import { fakeDbIo } from "./__fixtures__/fake-db-io.ts";
import { FIXTURE_ROOT, fixtureProduct } from "./__fixtures__/fixture-product.ts";
import { type MigrateInput, migrateBinding } from "./migrate-binding.ts";

const DIR = join(FIXTURE_ROOT, "db/migrations");

function input(database: string | undefined, name: string | null = "web-prod"): MigrateInput & { spawned: string[] } {
  const { events, io } = fakeDbIo();
  const migrations = { MAIN_DB: { ...(database === undefined ? {} : { database }), dir: DIR, owner: "web-api" } };
  const kit = fixtureConfig(fixtureEnv(), { migrations });

  return {
    binding: "MAIN_DB",
    databaseName: name ?? undefined,
    env: {},
    io,
    kit,
    product: fixtureProduct(),
    scope: "prod",
    spawned: events,
  };
}

it("skips a binding the kit gives no database, spawning nothing", async () => {
  const given = input(undefined);

  expect(await migrateBinding(given)).toStrictEqual({
    binding: "MAIN_DB",
    databaseName: "web-prod",
    durationMs: 0,
    migrationsApplied: 0,
    note: "no database in the kit's migrations",
    status: "skipped",
  });
  expect(given.spawned).toStrictEqual([]);
});

it("fails a binding with no database_name before spawning", async () => {
  const given = input("main", null);

  expect(await migrateBinding(given)).toMatchObject({ note: "binding has no database_name", status: "failed" });
  expect(given.spawned).toStrictEqual([]);
});

it("fails naming the migrations dir when no database.migrate.config.ts is above it", async () => {
  const given = {
    ...input("main"),
    kit: fixtureConfig(fixtureEnv(), {
      migrations: { MAIN_DB: { database: "main", dir: join(FIXTURE_ROOT, "api/src"), owner: "web-api" } },
    }),
  };

  await expect(migrateBinding(given)).rejects.toThrow("no database.migrate.config.ts above apps/web/api/src");
});
