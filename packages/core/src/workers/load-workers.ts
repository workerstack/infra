import { dirname, relative, sep } from "node:path";

import { discoverCfConfigs } from "../cf-config/discover-cf-configs.ts";
import { loadProductKit } from "../cf-config/load-product-kit.ts";
import { readCfConfig } from "../cf-config/read-cf-config.ts";
import { discoverProducts, type Product } from "../products.ts";
import { DEPLOY_SCOPES } from "./deploy-scopes.constants.ts";
import type { WorkerCatalog } from "./worker-catalog.ts";
import { workerOf } from "./worker-of.ts";
import type { WorkerRecord } from "./worker-record.ts";

async function productWorkers(root: string, product: Product): Promise<WorkerRecord[]> {
  const files = discoverCfConfigs(product.root);

  if (files.length === 0) return [];

  const kit = await loadProductKit(product.root);
  const scopes = DEPLOY_SCOPES.filter((scope) => kit.envs.includes(scope));

  return Promise.all(
    files.map(async (file) => {
      const read = await Promise.all(scopes.map(async (scope) => ({ config: await readCfConfig(file, scope), scope })));

      return workerOf({ dir: relative(root, dirname(file)).split(sep).join("/"), file, product, read });
    }),
  );
}

/**
 * Every Worker package of every product under `root`: its kit's deploy scopes, each read from the package's
 * `cloudflare.config.ts`. A product with no Worker package contributes none.
 */
export async function loadWorkers(root: string): Promise<WorkerCatalog> {
  const products = await discoverProducts(root);
  const perProduct = await Promise.all(products.map((product) => productWorkers(root, product)));

  return { root, workers: perProduct.flat().toSorted((a, b) => a.dir.localeCompare(b.dir, "en")) };
}
