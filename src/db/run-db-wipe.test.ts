import { existsSync } from "node:fs";

import { expect, it } from "vitest";

import { testHost } from "../command/__fixtures__/test-host.ts";
import { fakeD1 } from "./__fixtures__/fake-d1.ts";
import { fakeDbIo } from "./__fixtures__/fake-db-io.ts";
import { tempProducts } from "./__fixtures__/temp-products.ts";
import { runDbWipe } from "./run-db-wipe.ts";

const SCHEMA = 'CREATE TABLE users (id integer);\nCREATE TABLE IF NOT EXISTS "posts" (id integer);\n';
const setup = tempProducts(SCHEMA);

function summary(lines: string[]): string {
  return lines.join("\n").replaceAll(/\d+ms/g, "Nms");
}

it("refuses a prod wipe without --force before any credential is read, and runs one with it", async () => {
  const d1 = fakeD1({ users: 3 });
  const { events, io } = fakeDbIo({ onSpawn: d1.onSpawn });
  const { err, host } = testHost([setup()]);

  expect(await runDbWipe(["--scope", "prod"], host, io)).toBe(1);
  expect(err).toStrictEqual(["infra db-wipe: apps/web: Refusing to wipe prod. Pass --force if you meant it."]);
  expect(events).toStrictEqual([]);
  expect(await runDbWipe(["--scope", "prod", "--force"], host, io)).toBe(0);
  expect(events[0]).toBe("env");
});

const LEFTOVERS = { _cf_KV: 1, d1_migrations: 2, legacy: 4, posts: 5, sqlite_sequence: 1, users: 3 };

it("lists, then deletes schema tables, drops the rest and keeps migration tables", async () => {
  const d1 = fakeD1(LEFTOVERS);
  const { calls, io } = fakeDbIo({ onSpawn: d1.onSpawn });

  expect(await runDbWipe(["--scope", "dev"], testHost([setup()]).host, io)).toBe(0);
  expect(calls.map((call) => call.tool)).toStrictEqual(["wrangler", "wrangler"]);
  expect(calls[0]?.args.slice(0, 5)).toStrictEqual(["d1", "execute", "db-dev", "--remote", "--yes"]);
  expect(d1.files[0]).toStrictEqual([
    "PRAGMA defer_foreign_keys = ON;",
    'DROP TABLE IF EXISTS "legacy";',
    'DELETE FROM "posts";',
    'DELETE FROM "sqlite_sequence";',
    'DELETE FROM "users";',
    "PRAGMA defer_foreign_keys = OFF;",
  ]);
  expect([...d1.tables.keys()]).toStrictEqual(["_cf_KV", "d1_migrations", "posts", "sqlite_sequence", "users"]);
  expect(d1.tables.get("d1_migrations")).toBe(2);
});

it("runs the SQL through a temp file that is gone after, and prints the summary", async () => {
  const d1 = fakeD1(LEFTOVERS);
  const { io, out } = fakeDbIo({ onSpawn: d1.onSpawn });

  expect(await runDbWipe(["--scope", "dev"], testHost([setup()]).host, io)).toBe(0);
  expect(d1.paths.map((path) => existsSync(path))).toStrictEqual([false]);
  expect(summary(out)).toBe(
    [
      "apps/web",
      "  BINDING  DATABASE  STATUS  DELETED  DROPPED  TIME",
      "  DB       db-dev    wiped   3        1        Nms",
    ].join("\n"),
  );
});

it("only plans on --dry-run: no SQL file is run", async () => {
  const d1 = fakeD1({ legacy: 4, users: 3 });
  const { calls, io, out } = fakeDbIo({ onSpawn: d1.onSpawn });

  expect(await runDbWipe(["--scope", "dev", "--dry-run"], testHost([setup()]).host, io)).toBe(0);
  expect(calls).toHaveLength(1);
  expect(d1.files).toStrictEqual([]);
  expect(summary(out)).toContain("dry-run  1        1");
});

it("converges on a rerun after a partial wipe: it plans only what is left, then changes nothing more", async () => {
  const d1 = fakeD1({ legacy: 4, posts: 5, users: 3 }, 3);
  const { io, out } = fakeDbIo({ onSpawn: d1.onSpawn });
  const { err, host } = testHost([setup()]);

  expect(await runDbWipe(["--scope", "dev"], host, io)).toBe(1);
  expect(err).toStrictEqual(["infra db-wipe: apps/web: 1 of 1 databases failed"]);
  expect(out.join("\n")).toContain("↳ D1 error: interrupted");
  expect([...d1.tables.entries()]).toStrictEqual([
    ["posts", 0],
    ["users", 3],
  ]);

  d1.fail.after = undefined;

  expect(await runDbWipe(["--scope", "dev"], host, io)).toBe(0);
  expect(d1.files[1]).toStrictEqual([
    "PRAGMA defer_foreign_keys = ON;",
    'DELETE FROM "posts";',
    'DELETE FROM "users";',
    "PRAGMA defer_foreign_keys = OFF;",
  ]);
  expect(await runDbWipe(["--scope", "dev"], host, io)).toBe(0);
  expect(d1.files[2]).toStrictEqual(d1.files[1]);
  expect([...d1.tables.entries()]).toStrictEqual([
    ["posts", 0],
    ["users", 0],
  ]);
});
