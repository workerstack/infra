import { cloudflareOf } from "../command/cloudflare-of.ts";
import { realClient } from "../command/real-client.ts";
import { setRedirectRules } from "../operations/set-redirect-rules.ts";
import type { Product } from "../products.ts";
import { zoneRedirects } from "../redirects/zone-redirects.ts";

/** Writes the product's zone redirect list with its account credentials and answers the rules' descriptions. */
export async function setProductRedirects(product: Product): Promise<string[]> {
  const { zone } = cloudflareOf(product);
  const rules = await zoneRedirects(product.root, zone);

  await setRedirectRules(realClient(product.config.env, zone.zoneId), rules);

  return rules.map((rule) => rule.description);
}
