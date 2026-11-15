import type { Product } from "../products.ts";
import type { Provisioned } from "../provision/provisioned.ts";
import type { SetDeps } from "./set-deps.ts";

/** Applies the Google, Apple and Microsoft config, in that order; Microsoft's edits and secrets collect in `out`. */
export async function setVendors(deps: SetDeps, product: Product, out: Provisioned): Promise<void> {
  const { apple, env, google, microsoft } = product.config;
  const { log } = deps;

  if (google !== undefined) {
    log(`\n Google: ${product.name}`);
    await deps.applyGoogle({ config: google, env, log });
    log(" Done: Google");
  }

  if (apple !== undefined) {
    log(`\n Apple: ${product.name}`);
    await deps.applyApple({ config: apple, env, log });
    log(" Done: Apple");
  }

  if (microsoft === undefined) return;

  log(`\n Microsoft: ${product.name}`);

  const result = await deps.applyMicrosoft({ config: microsoft, env, log });

  out.edits.push(...result.edits);
  out.secrets.push(...result.secrets);
  log(" Done: Microsoft");
}
