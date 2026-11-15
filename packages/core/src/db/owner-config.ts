import { readFileSync } from "node:fs";

import { z } from "zod";

import { GENERATED_DIR } from "../cf-config/cf-config.constants.ts";
import { findInProduct } from "../cf-config/find-in-product.ts";
import type { Product } from "../products.ts";
import { parseJsonc } from "../shared/jsonc.ts";
import type { DbScope } from "./db-scope.ts";

/** What finds the generated config that grants a D1 binding its migrations: the binding, its dir and the scope. */
export type OwnerQuery = { binding: string; dir: string; scope: DbScope };

function grants(file: string, query: OwnerQuery): boolean {
  const entry = z.object({ binding: z.string(), migrations_dir: z.string().optional() });

  const parsed = z
    .object({ d1_databases: z.array(entry).optional() })
    .safeParse(parseJsonc(readFileSync(file, "utf8")));

  return (
    parsed.success &&
    (parsed.data.d1_databases ?? []).some((db) => db.binding === query.binding && db.migrations_dir === query.dir)
  );
}

/**
 * The generated `wrangler.<scope>.json` of the one package that grants the binding the kit's migrations dir: what
 * `wrangler d1 execute` finds the database through. None, or two, fails.
 */
export function ownerConfig(product: Product, query: OwnerQuery): string {
  const owners = findInProduct(product.root, `**/${GENERATED_DIR}/wrangler.${query.scope}.json`).filter((file) =>
    grants(file, query),
  );

  const [owner, extra] = owners;

  if (owner === undefined)
    throw new Error(`no generated wrangler.${query.scope}.json grants ${query.binding} its migrations; run infra gen`);

  if (extra !== undefined)
    throw new Error(`${owners.length} packages own ${query.binding} in ${query.scope}: ${owners.join(", ")}`);

  return owner;
}
