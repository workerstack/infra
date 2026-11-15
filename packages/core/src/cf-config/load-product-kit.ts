import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { PRODUCT_ROOT } from "../cf-kit/cf-kit.constants.ts";
import type { CfKit } from "../cf-kit/cf-kit.ts";
import { isCfKit } from "../cf-kit/is-cf-kit.ts";
import { INFRA_CONFIG_FILE } from "../products.ts";
import { posixRelative } from "../shared/posix-relative.ts";
import { KIT_MOVED_MESSAGE } from "./cf-config.constants.ts";
import { findInProduct } from "./find-in-product.ts";

// A kit file from before `defineInfraConfig` built the kit: its options belong in `cloudflare.workers` now.
function refuseKitFiles(productRoot: string): void {
  const moves = findInProduct(productRoot, "**/*.cf-kit.ts").map(
    (file) => `${posixRelative(productRoot, file)}: ${KIT_MOVED_MESSAGE}`,
  );

  if (moves.length > 0) throw new Error(moves.join("\n"));
}

/**
 * The kit the product's `infra.config.ts` default-exports, handed the product root, where its unset rate-limit
 * registry lives. A leftover kit file, or a default export that is not `defineInfraConfig`'s value, fails naming
 * the file.
 */
export async function loadProductKit(productRoot: string): Promise<CfKit> {
  refuseKitFiles(productRoot);

  const href = pathToFileURL(join(productRoot, INFRA_CONFIG_FILE)).href;
  const loaded = await (import(href) /* an infra.config.ts module */ as Promise<{ default?: unknown }>);

  if (!isCfKit(loaded.default)) {
    const fix = "export default defineInfraConfig({ ... })";

    throw new Error(`${INFRA_CONFIG_FILE}: default export is not what defineInfraConfig returns; ${fix}`);
  }

  loaded.default[PRODUCT_ROOT](productRoot);

  return loaded.default;
}
