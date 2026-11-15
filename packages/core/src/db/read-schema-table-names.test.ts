import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { parseCreateTableNames } from "./parse-create-table-names.ts";
import { readSchemaTableNames } from "./read-schema-table-names.ts";

const made: string[] = [];

afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { force: true, recursive: true });
});

it("extracts bare, quoted and backticked names, with VIRTUAL and IF NOT EXISTS, and not commented ones", () => {
  const sql =
    "-- CREATE TABLE old (a);\nCREATE TABLE a (x);\n" +
    "CREATE VIRTUAL TABLE `b` USING fts5(x);\ncreate table if not exists " +
    '"c" (y);';

  expect(parseCreateTableNames(sql)).toStrictEqual(["a", "b", "c"]);
});

it("reads the tables of every .sql file in a migrations dir, and fails for a missing dir", () => {
  const dir = mkdtempSync(join(tmpdir(), "schema-"));

  made.push(dir);
  mkdirSync(join(dir, "m"));
  writeFileSync(join(dir, "m/0001.sql"), "CREATE TABLE users (id);");
  writeFileSync(join(dir, "m/0002.sql"), "CREATE TABLE posts (id);");
  writeFileSync(join(dir, "m/notes.md"), "CREATE TABLE ignored (id);");

  expect([...readSchemaTableNames(join(dir, "m"))].toSorted()).toStrictEqual(["posts", "users"]);
  expect(() => readSchemaTableNames(join(dir, "nope"))).toThrow("migrations dir does not exist");
});
