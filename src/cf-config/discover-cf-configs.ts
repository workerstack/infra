import { CF_CONFIG_FILE } from "./cf-config.constants.ts";
import { findInProduct } from "./find-in-product.ts";

/** Every `cloudflare.config.ts` of a product: its Worker packages, absolute and sorted. */
export function discoverCfConfigs(productRoot: string): string[] {
  return findInProduct(productRoot, `**/${CF_CONFIG_FILE}`);
}
