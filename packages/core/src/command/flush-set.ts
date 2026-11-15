import type { Product } from "../products.ts";
import { applyEdits } from "../provision/apply-edits.ts";
import type { SetRun } from "./set-cloudflare.ts";
import type { SetDeps } from "./set-deps.ts";

/**
 * Writes the collected ids into the product's config file in one write, then sends every secret to
 * `writeSecrets`. A secret never reaches the config file.
 */
export async function flushSet(deps: SetDeps, product: Product, run: SetRun): Promise<void> {
  const { edits, secrets } = run.out;

  if (edits.length > 0) {
    const text = applyEdits(await deps.readConfig(product.configFile), edits);

    await deps.writeConfig(product.configFile, text);
    deps.log(` Updated ${product.configFile} with ${edits.length} id(s)`);
  }

  if (secrets.length > 0) await deps.writeSecrets(run.root, product, secrets);
}
