import { expect, it } from "vitest";

import { buildWipePlan } from "./build-wipe-plan.ts";
import { isKeepRowsTable } from "./is-keep-rows-table.ts";
import { quoteIdent } from "./quote-ident.ts";

function row(name: string, type = "table") {
  return { name, sql: null, type };
}

it("deletes schema tables, drops the rest, and skips migration tables, Cloudflare tables and views", () => {
  const live = [
    row("users"),
    row("legacy"),
    row("d1_migrations"),
    row("_cf_KV"),
    row("sqlite_sequence"),
    row("v", "view"),
  ];

  const plan = buildWipePlan(live, new Set(["users"]));

  expect(plan).toStrictEqual({
    deleted: ["users", "sqlite_sequence"],
    dropped: ["legacy"],
    skipped: ["d1_migrations", "_cf_KV", "v"],
    sql: [
      "PRAGMA defer_foreign_keys = ON;",
      'DROP TABLE IF EXISTS "legacy";',
      'DELETE FROM "users";',
      'DELETE FROM "sqlite_sequence";',
      "PRAGMA defer_foreign_keys = OFF;",
    ].join("\n"),
  });
});

it("plans nothing when only protected tables exist", () => {
  const plan = buildWipePlan([row("__drizzle_migrations"), row("sqlite_stat1")], new Set());

  expect([plan.deleted, plan.dropped]).toStrictEqual([[], []]);
});

it("keeps migration, Cloudflare and SQLite internal tables, but not sqlite_sequence or app tables", () => {
  expect(["d1_migrations", "__drizzle_migrations", "_cf_METADATA", "sqlite_stat1"].map(isKeepRowsTable)).toStrictEqual([
    true,
    true,
    true,
    true,
  ]);
  expect(["sqlite_sequence", "users"].map(isKeepRowsTable)).toStrictEqual([false, false]);
});

it("double-quotes an identifier and refuses any other name", () => {
  expect(quoteIdent("user_1")).toBe('"user_1"');
  expect(() => quoteIdent('a"; DROP TABLE b')).toThrow("Refusing non-identifier table name");
  expect(() => quoteIdent("1a")).toThrow("Refusing non-identifier table name");
});
