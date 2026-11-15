import { expect, it } from "vitest";

import { parseTableRows } from "./parse-table-rows.ts";

const JSON_OUT = JSON.stringify([
  { results: [{ name: "users", sql: "CREATE TABLE users (id)", type: "table" }, { name: "t" }] },
]);

it("reads a clean wrangler --json array, defaulting the type and the sql", () => {
  expect(parseTableRows(JSON_OUT)).toStrictEqual([
    { name: "users", sql: "CREATE TABLE users (id)", type: "table" },
    { name: "t", sql: null, type: "table" },
  ]);
});

it("reads through a banner before the JSON and noise after it", () => {
  expect(parseTableRows(`wrangler 4\n${JSON_OUT}\nbye`)).toHaveLength(2);
});

it("fails for stdout with no JSON or no results", () => {
  expect(() => parseTableRows("no json")).toThrow("wrangler --json produced no JSON");
  expect(() => parseTableRows("[]")).toThrow("wrangler --json missing results[]");
  expect(() => parseTableRows('[{"results":[{"sql":"x"}]}]')).toThrow("wrangler --json missing results[]");
});
