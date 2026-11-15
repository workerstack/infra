import { cpSync, globSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { Product } from "../../products.ts";
import { fakeInfraEnv } from "../../shared/__fixtures__/fake-infra-env.ts";

const SRC = join(import.meta.dirname, "../..");
// Under the package, so a copy still resolves `cf/config` and `@cloudflare/config`.
const WORK = join(import.meta.dirname, "../../../.tmp");
const made: string[] = [];

/**
 * A copy of the `stack-product` fixture as `apps/web` under the package's `.tmp/`: `api` a Worker, `web` a Vite
 * package in `local.apps`, `site` a Vite package not in it, `box` a container Worker. `apps` replaces the kit's
 * `local.apps`. `cleanStackProducts` removes the copies.
 */
export function stackProduct(apps: readonly string[] = ["web"]): Product {
  mkdirSync(WORK, { recursive: true });

  const root = mkdtempSync(join(WORK, "loc-stack-"));
  const productRoot = join(root, "apps/web");

  made.push(root);
  cpSync(join(import.meta.dirname, "stack-product"), productRoot, { recursive: true });

  for (const file of globSync("**/*.ts", { cwd: productRoot })) {
    const path = join(productRoot, file);
    const text = readFileSync(path, "utf8").replaceAll('from "../../../', `from "${SRC}/`);

    writeFileSync(path, text.replace('apps: ["web"]', `apps: ${JSON.stringify(apps)}`));
  }

  const local = { apps, host: "example.localhost", vars: () => ({}) };

  return { config: { env: fakeInfraEnv(), local }, configFile: join(productRoot, "infra.config.ts"), name: "apps/web", root: productRoot };
}

export function cleanStackProducts(): void {
  for (const root of made.splice(0)) rmSync(root, { force: true, recursive: true });
}
