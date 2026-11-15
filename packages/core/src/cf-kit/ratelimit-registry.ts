import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

import { INFRA_CONFIG_FILE } from "../products.ts";
import { NO_REGISTRY_MESSAGE, PRODUCT_ROOT, RATELIMIT_IDS_FILE } from "./cf-kit.constants.ts";
import type { CfKit } from "./cf-kit.ts";

// The product a process runs in when no loader named it: `cf workers types` or `vite dev` in a Worker package.
function productAbove(dir: string): string | undefined {
  if (existsSync(join(dir, INFRA_CONFIG_FILE))) return dir;

  const parent = dirname(dir);

  return parent === dir ? undefined : productAbove(parent);
}

/**
 * Where one kit's limiter ids live: the set path, else `ratelimit-ids.json` at the product root, the one the loader
 * of `infra.config.ts` handed the kit or, with none handed, the nearest above the cwd. None fails naming the fixes.
 */
export function ratelimitRegistry(set: string | undefined): Pick<CfKit, typeof PRODUCT_ROOT | "ratelimitFile"> {
  let handed: string | undefined;

  return {
    [PRODUCT_ROOT](productRoot) {
      handed = productRoot;
    },
    ratelimitFile() {
      if (set !== undefined) return set;

      const root = handed ?? productAbove(process.cwd());

      if (root === undefined) throw new Error(NO_REGISTRY_MESSAGE);

      return join(root, RATELIMIT_IDS_FILE);
    },
  };
}
