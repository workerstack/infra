import type { Product } from "../products.ts";
import { flushSet } from "./flush-set.ts";
import { setCloudflare } from "./set-cloudflare.ts";
import type { SetRun } from "./set-cloudflare.ts";
import type { SetDeps } from "./set-deps.ts";
import { setVendors } from "./set-vendors.ts";

/**
 * One product: Cloudflare, then Google, Apple and Microsoft. What was provisioned is written even when a later
 * step fails, so a created resource's id and secret are not lost.
 */
export async function setProduct(deps: SetDeps, product: Product, root: string): Promise<void> {
  const run: SetRun = { out: { edits: [], secrets: [] }, root };

  try {
    if (product.config.cloudflare !== undefined) await setCloudflare(deps, product, run);

    await setVendors(deps, product, run.out);
  } finally {
    await flushSet(deps, product, run);
  }
}
