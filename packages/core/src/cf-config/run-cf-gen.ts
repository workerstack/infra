import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

import { ALLOCATE_RATELIMITS } from "../cf-kit/cf-kit.constants.ts";
import type { CfKit } from "../cf-kit/cf-kit.ts";
import { findLocalStack } from "../local/stack-state.ts";
import type { Product } from "../products.ts";
import { checkLocaleRedirects } from "../redirects/check-locale-redirects.ts";
import type { InfraScope } from "../schema/infra.ts";
import type { Log } from "../shared/log.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { discoverCfConfigs } from "./discover-cf-configs.ts";
import { driftOf } from "./drift-of.ts";
import { loadProductKit } from "./load-product-kit.ts";
import type { PackageInput } from "./package-input.ts";
import { planCfPackage } from "./plan-cf-package.ts";
import { writePlanned } from "./write-planned.ts";

/** What `runCfGen` runs: the product, whether only to check, and how it types a package it wrote (`cfTypes`). */
type CfGen = {
  check: boolean;
  log: Log;
  product: Product;
  runTypes: (dir: string, scope: InfraScope) => Promise<void>;
};

type ProductRun = CfGen & { kit: CfKit };

// A path as the run prints it: from the scan root, posix.
function shownPath(product: Product, file: string): string {
  return join(product.name, relative(product.root, file)).split(sep).join("/");
}

function readRegistry(file: string): string {
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

// Generates one package, allocating rate-limit ids, and types it; prints each file it changed.
async function generate(run: ProductRun, input: PackageInput): Promise<void> {
  const registry = run.kit.ratelimitFile();
  const before = readRegistry(registry);
  const written = writePlanned(await run.kit[ALLOCATE_RATELIMITS](() => planCfPackage(input)));

  if (readRegistry(registry) !== before) written.push(registry);

  for (const file of written) run.log(`wrote ${shownPath(run.product, file)}`);

  await run.runTypes(input.dir, "prod");
}

/**
 * `infra gen` for one product: every Worker package's `.cloudflare/wrangler.<scope>.json` and `.dev.vars.<scope>`,
 * after its locale redirects are checked against its zone. Under `check` it writes nothing and fails naming each
 * file that is out of date; otherwise it types each package in the `prod` mode. A product with no
 * `cloudflare.config.ts` has nothing to do.
 */
export async function runCfGen(input: CfGen): Promise<void> {
  const { product } = input;
  const configs = discoverCfConfigs(product.root);

  if (configs.length === 0) return;

  const kit = await loadProductKit(product.root);
  const origin = findLocalStack(product.root)?.origin;
  const drift: string[] = [];

  await checkLocaleRedirects({ listed: kit.localeApps, productRoot: product.root });
  await runInOrder(configs, async (file) => {
    const target = { dir: dirname(file), kit, origin, shown: shownPath(product, file) };

    if (input.check) drift.push(...driftOf(await planCfPackage(target)).map((path) => shownPath(product, path)));
    else await generate({ ...input, kit }, target);
  });

  if (drift.length > 0) throw new Error(drift.map((file) => `${file} is out of date; run infra gen`).join("\n"));
}
