import { cpSync, globSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { Product } from "../../products.ts";
import { fakeInfraEnv } from "../../shared/__fixtures__/fake-infra-env.ts";

const SRC = join(import.meta.dirname, "../..");
// Under the package, so a copy still resolves `cf/config`, `@cloudflare/config` and `wrangler`.
const WORK = join(import.meta.dirname, "../../../.tmp");
const made: string[] = [];

/** A product of the copy: what `runCfGen` reads, `name` relative to the copy's root. */
export type CopiedProduct = { product: Product; root: string };

/**
 * A copy of the `product` fixture under the package's `.tmp/`, as `apps/web` of a repo-shaped root. Its imports of
 * the package's source are made absolute, since the copy sits elsewhere. `cleanCopies` removes them.
 */
export function copyProduct(): CopiedProduct {
  mkdirSync(WORK, { recursive: true });

  const root = mkdtempSync(join(WORK, "cf-gen-"));
  const productRoot = join(root, "apps/web");

  made.push(root);
  cpSync(join(import.meta.dirname, "product"), productRoot, { recursive: true });

  for (const file of globSync("**/*.ts", { cwd: productRoot })) {
    const path = join(productRoot, file);

    writeFileSync(path, readFileSync(path, "utf8").replaceAll('from "../../../', `from "${SRC}/`));
  }

  const config = { env: fakeInfraEnv() };
  const product = { config, configFile: join(productRoot, "infra.config.ts"), name: "apps/web", root: productRoot };

  return { product, root };
}

/** Gives the fixture's limiter an id in every scope, so its configs load without allocating. */
export function seedRegistry(productRoot: string): void {
  const ids = { "web-api": { dev: { LIMIT_5: 2 }, local: { LIMIT_5: 1 }, prod: { LIMIT_5: 3 } } };

  writeFileSync(join(productRoot, "ratelimit-ids.json"), JSON.stringify(ids));
}

export function cleanCopies(): void {
  for (const root of made.splice(0)) rmSync(root, { force: true, recursive: true });
}
