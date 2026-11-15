import { cpSync } from "node:fs";
import { join } from "node:path";

import { copyProduct, seedRegistry } from "../../cf-config/__fixtures__/copy-product.ts";
import { absoluteImports } from "../../shared/__fixtures__/absolute-imports.ts";

const SRC = join(import.meta.dirname, "../..");

/**
 * A root of two products: the cf-config fixture as `apps/web` (Worker `web-api` in `api/`) and the `second`
 * fixture as `apps/docs` (Worker `docs-site` in `worker/`). `cleanCopies` removes it.
 */
export function copyRoot(): string {
  const { root } = copyProduct();
  const web = join(root, "apps/web");
  const docs = join(root, "apps/docs");

  seedRegistry(web);
  cpSync(join(import.meta.dirname, "second"), docs, { recursive: true });

  absoluteImports(docs, "../../../", SRC);

  return root;
}
