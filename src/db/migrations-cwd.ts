import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import type { Product } from "../products.ts";
import { MIGRATE_CONFIG_FILE } from "./migrate-config-file.constants.ts";

function nearest(root: string, at: string): string | undefined {
  if (existsSync(join(at, MIGRATE_CONFIG_FILE))) return at;

  return at === root || at === dirname(at) ? undefined : nearest(root, dirname(at));
}

/** The nearest directory from `dir` up to the product root that holds `database.migrate.config.ts`. */
export function migrationsCwd(product: Product, dir: string): string {
  const found = nearest(product.root, dir);

  if (found === undefined)
    throw new Error(`no ${MIGRATE_CONFIG_FILE} above ${join(product.name, relative(product.root, dir))}`);

  return found;
}
