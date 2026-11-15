import { existsSync, globSync } from "node:fs";
import { join } from "node:path";

import { INFRA_CONFIG_FILE } from "../products.ts";
import { CF_SKIPPED_DIR } from "./cf-config.constants.ts";

/**
 * The files under a product root matching `pattern`, absolute and sorted. Installed packages, git dirs, worktrees
 * and nested products (a dir with its own `infra.config.ts`) are not the product's.
 */
export function findInProduct(productRoot: string, pattern: string): string[] {
  function skipped(entry: string): boolean {
    return CF_SKIPPED_DIR.test(entry) || existsSync(join(productRoot, entry, INFRA_CONFIG_FILE));
  }

  return globSync(pattern, { cwd: productRoot, exclude: skipped })
    .map((file) => join(productRoot, file))
    .toSorted();
}
