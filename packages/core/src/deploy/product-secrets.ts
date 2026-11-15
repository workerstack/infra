import { join } from "node:path";

import { CF_CONFIG_FILE } from "../cf-config/cf-config.constants.ts";
import { declaredSecrets } from "../cf-config/declared-secrets.ts";
import { loadProductKit } from "../cf-config/load-product-kit.ts";
import { readCfConfig } from "../cf-config/read-cf-config.ts";
import type { DeployScope } from "../workers/deploy-scope.ts";
import type { WorkerTarget } from "../workers/worker-target.ts";

/** The values of the secrets the Worker's `cloudflare.config.ts` declares in `scope`, from its product's kit. */
export async function productSecrets(target: WorkerTarget, scope: DeployScope): Promise<Record<string, string>> {
  const { packageDir, product } = target.worker;
  const kit = await loadProductKit(product.root);
  const config = await readCfConfig(join(packageDir, CF_CONFIG_FILE), scope);

  return kit.secretValues(scope, declaredSecrets(config.wrangler));
}
