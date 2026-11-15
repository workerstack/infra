import { cpSync, globSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { copyProduct, seedRegistry } from "../../cf-config/__fixtures__/copy-product.ts";

const SRC = join(import.meta.dirname, "../..");

// What the cf-config fixture lacks: an infra.config.ts, so discovery finds it as a product.
const WEB_CONFIG = `import { defineInfraConfig } from "${SRC}/define-infra-config.ts";
import { fakeInfraEnv } from "${SRC}/shared/__fixtures__/fake-infra-env.ts";

export default defineInfraConfig({ env: fakeInfraEnv() });
`;

/**
 * A root of two products: the cf-config fixture as `apps/web` (Worker `web-api` in `api/`) and the `second`
 * fixture as `apps/docs` (Worker `docs-site` in `worker/`). `cleanCopies` removes it.
 */
export function copyRoot(): string {
  const { root } = copyProduct();
  const web = join(root, "apps/web");
  const docs = join(root, "apps/docs");

  writeFileSync(join(web, "infra.config.ts"), WEB_CONFIG);
  seedRegistry(web);
  cpSync(join(import.meta.dirname, "second"), docs, { recursive: true });

  for (const file of globSync("**/*.ts", { cwd: docs })) {
    const path = join(docs, file);

    writeFileSync(path, readFileSync(path, "utf8").replaceAll('from "../../../', `from "${SRC}/`));
  }

  return root;
}
