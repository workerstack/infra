import { globSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import type { InfraConfig } from "./schema/infra.ts";

export const INFRA_CONFIG_FILE = "infra.config.ts";

// A directory name, or a path ending in one, that the scan never enters.
const SKIPPED_DIR = /(?:^|\/)(?:node_modules|\.git|\.worktrees|dist|\.tmp|\.repo)$/;

/** One product: `name` is its config's directory relative to the scan root, posix (`.` at the root). */
export type Product = {
  name: string;
  root: string;
  configFile: string;
  config: InfraConfig;
};

export type Selection = { ok: true; products: Product[] } | { ok: false; error: string };

export type ProductTarget = { all: true } | { name: string } | undefined;

/** Imports every `infra.config.ts` under `root` outside the skipped directories; sorted by name. */
export async function discoverProducts(root: string): Promise<Product[]> {
  const files = globSync(`**/${INFRA_CONFIG_FILE}`, { cwd: root, exclude: (entry) => SKIPPED_DIR.test(entry) });
  const products = await Promise.all(files.map((file) => loadProduct(root, file)));

  return products.toSorted((a, b) => a.name.localeCompare(b.name, "en"));
}

type ConfigModule = { default?: InfraConfig };

async function loadProduct(root: string, file: string): Promise<Product> {
  const configFile = join(root, file);
  const href = pathToFileURL(configFile).href;
  const shown = file.split(sep).join("/");
  // An infra.config.ts default-exports what defineInfraConfig returned; the checks below guard a wrong module.
  const loaded = await (import(href) /* the file is an infra.config.ts module */ as Promise<ConfigModule>);

  if (loaded.default === undefined)
    throw new Error(`${shown}: no default export; export default defineInfraConfig({ ... })`);

  if (!(loaded.default instanceof Object))
    throw new Error(`${shown}: default export is not an infra config; export default defineInfraConfig({ ... })`);

  const dir = join(root, file, "..");
  const name = relative(root, dir).split(sep).join("/");

  return { config: loaded.default, configFile, name: name === "" ? "." : name, root: dir };
}

/** `root` words the error for a scan that found nothing. */
export function selectProducts(root: string, products: Product[], target: ProductTarget): Selection {
  const names = products.map((product) => product.name).join(", ");

  if (products.length === 0) return { error: `no ${INFRA_CONFIG_FILE} under ${root}`, ok: false };

  if (target !== undefined && "all" in target) return { ok: true, products };

  if (target !== undefined) {
    const match = products.find((product) => product.name === target.name);

    if (match === undefined) return { error: `no product "${target.name}"; products: ${names}`, ok: false };

    return { ok: true, products: [match] };
  }

  if (products.length > 1) return { error: `${products.length} products; name one or pass --all: ${names}`, ok: false };

  return { ok: true, products };
}

/** The deepest product whose root is `dir` or an ancestor of it; a relative `dir` is taken from `root`. */
export function productAt(root: string, products: Product[], dir: string): Selection {
  const target = resolve(root, dir);

  const holding = products
    .filter((product) => holds(product.root, target))
    .toSorted((a, b) => b.root.length - a.root.length);

  const [deepest] = holding;

  if (deepest !== undefined) return { ok: true, products: [deepest] };

  const names = products.map((product) => product.name).join(", ");

  return { error: `no product holds ${target}; run it inside one of: ${names}`, ok: false };
}

function holds(productRoot: string, dir: string): boolean {
  const path = relative(productRoot, dir);

  return path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}
