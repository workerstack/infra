import type { Product } from "../products.ts";
import type { CloudflareConfig } from "../schema/cloudflare.ts";

/** The product's Cloudflare config; a product with none fails with the zone line. */
export function cloudflareOf(product: Product): CloudflareConfig {
  const { cloudflare } = product.config;

  if (cloudflare === undefined) throw new Error("no cloudflare zone in the config");

  return cloudflare;
}
