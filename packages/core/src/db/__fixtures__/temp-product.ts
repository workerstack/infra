import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { Product } from "../../products.ts";
import { absoluteImports } from "../../shared/__fixtures__/absolute-imports.ts";
import { FIXTURE_ROOT, fixtureProduct } from "./fixture-product.ts";

const SRC = join(import.meta.dirname, "../..");

/** A copy of the fixture product in the OS temp dir that holds `schema` as its migrations and a generated config. */
export type TempProduct = { dir: string; product: Product; remove: () => void };

/**
 * The fixture product copied to a temp dir, its imports of the package's source made absolute: `schema` is its one
 * migration file, and `api/.cloudflare/wrangler.<scope>.json` grants `DB` the migrations dir, as `infra gen` does.
 */
export function tempProduct(schema: string): TempProduct {
  const dir = mkdtempSync(join(tmpdir(), "db-product-"));

  cpSync(FIXTURE_ROOT, dir, { recursive: true });

  absoluteImports(dir, "../../../src/", SRC);

  writeFileSync(join(dir, "db/migrations/0001_init.sql"), schema);

  for (const scope of ["dev", "prod"]) {
    mkdirSync(join(dir, "api/.cloudflare"), { recursive: true });
    writeFileSync(
      join(dir, `api/.cloudflare/wrangler.${scope}.json`),
      JSON.stringify({ d1_databases: [{ binding: "DB", migrations_dir: join(dir, "db/migrations") }] }),
    );
  }

  return { dir, product: { ...fixtureProduct(), root: dir }, remove: () => rmSync(dir, { force: true, recursive: true }) };
}
