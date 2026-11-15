import { dirname } from "node:path";

import { discoverCfConfigs } from "../cf-config/discover-cf-configs.ts";
import { loadProductKit } from "../cf-config/load-product-kit.ts";
import { readCfConfig } from "../cf-config/read-cf-config.ts";
import { ALLOCATE_RATELIMITS } from "../cf-kit/cf-kit.constants.ts";
import type { Product } from "../products.ts";
import { candidateOf } from "./candidate-of.ts";
import type { ProductStack, StackCandidate, StackChoice } from "./stack-candidate.ts";
import { stackOf } from "./stack-of.ts";

// Each dir of `local.apps` is a Worker package of the product.
function checkApps(apps: readonly string[], candidates: readonly StackCandidate[]): void {
  const dirs = candidates.map((candidate) => candidate.dir).toSorted((a, b) => a.localeCompare(b, "en"));
  const missing = apps.find((dir) => !dirs.includes(dir));

  if (missing === undefined) return;

  const listed = dirs.join(", ");

  throw new Error(`local.apps names ${missing}, which has no cloudflare.config.ts (Worker packages: ${listed})`);
}

/**
 * A product's stack from its `cloudflare.config.ts` packages, by package dir. Each config is read for `local` and
 * `prod` with rate-limit allocation on, as the `infra gen` the stack runs next does.
 */
export async function productStack(product: Product, choice: StackChoice): Promise<ProductStack> {
  const files = discoverCfConfigs(product.root);

  if (files.length === 0) throw new Error("no cloudflare.config.ts, so it has no Workers to run");

  const kit = await loadProductKit(product.root);
  const { localHost } = kit;

  if (localHost === undefined) throw new Error("no local block in its infra config, so it has no local stack");

  const candidates: StackCandidate[] = await kit[ALLOCATE_RATELIMITS](() =>
    Promise.all(
      files.map(async (file) => {
        const [local, prod] = await Promise.all([readCfConfig(file, "local"), readCfConfig(file, "prod")]);

        return candidateOf({ dir: dirname(file), local, prod, productRoot: product.root }, kit, localHost);
      }),
    ),
  );

  checkApps(kit.localApps, candidates);

  return stackOf(
    candidates.toSorted((a, b) => a.dir.localeCompare(b.dir, "en")),
    choice,
  );
}
