import type { Product } from "../products.ts";
import type { Provisioned } from "../provision/provisioned.ts";
import type { SetDeps } from "./set-deps.ts";

function collect(out: Provisioned, result: Provisioned): void {
  out.edits.push(...result.edits);
  out.secrets.push(...result.secrets);
}

/**
 * Applies the Google, Apple, Microsoft and GitHub config, in that order; Microsoft's and GitHub's edits and secrets
 * collect in `out`.
 */
export async function setVendors(deps: SetDeps, product: Product, out: Provisioned): Promise<void> {
  const { apple, env, github, google, microsoft } = product.config;
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

  if (microsoft !== undefined) {
    log(`\n Microsoft: ${product.name}`);
    collect(out, await deps.applyMicrosoft({ config: microsoft, env, log }));
    log(" Done: Microsoft");
  }

  if (github === undefined) return;

  log(`\n GitHub: ${product.name}`);
  collect(out, await deps.applyGithub({ config: github, env, log }));
  log(" Done: GitHub");
}
