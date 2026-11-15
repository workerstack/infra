import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { fixtureProduct } from "./__fixtures__/fixture-product.ts";
import { type OwnerQuery, ownerConfig } from "./owner-config.ts";

const made: string[] = [];
const query: OwnerQuery = { binding: "DB", dir: "/abs/migrations", scope: "dev" };

type Generated = Record<string, { d1_databases: { binding: string; migrations_dir?: string }[] }>;

function product(files: Generated) {
  const root = mkdtempSync(join(tmpdir(), "owner-"));

  made.push(root);

  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(join(root, rel, ".."), { recursive: true });
    writeFileSync(join(root, rel), JSON.stringify(body));
  }

  return { ...fixtureProduct(), root };
}

function owns(dir: string) {
  return { d1_databases: [{ binding: "DB", migrations_dir: dir }] };
}

afterEach(() => {
  for (const root of made.splice(0)) rmSync(root, { force: true, recursive: true });
});

it("finds the generated file of the scope whose binding has the kit's migrations dir", () => {
  const found = product({
    "api/.cloudflare/wrangler.dev.json": owns("/abs/migrations"),
    "api/.cloudflare/wrangler.prod.json": owns("/abs/migrations"),
    "cron/.cloudflare/wrangler.dev.json": { d1_databases: [{ binding: "DB" }] },
  });

  expect(ownerConfig(found, query)).toBe(join(found.root, "api/.cloudflare/wrangler.dev.json"));
});

it("fails when no file, or two, own the binding", () => {
  expect(() => ownerConfig(product({}), query)).toThrow(
    "no generated wrangler.dev.json grants DB its migrations; run infra gen",
  );

  const two = product({
    "a/.cloudflare/wrangler.dev.json": owns("/abs/migrations"),
    "b/.cloudflare/wrangler.dev.json": owns("/abs/migrations"),
  });

  expect(() => ownerConfig(two, query)).toThrow("2 packages own DB in dev");
});
