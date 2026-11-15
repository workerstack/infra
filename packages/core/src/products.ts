import { globSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { PRODUCT_ROOT } from "./cf-kit/cf-kit.constants.ts";
import { isCfKit } from "./cf-kit/is-cf-kit.ts";
import type { InfraConfig } from "./schema/infra.ts";
import { posixRelative } from "./shared/posix-relative.ts";

/** The file name that marks a product: its config, default-exported from `defineInfraConfig`. */
export const INFRA_CONFIG_FILE = "infra.config.ts";

// A directory name, or a path ending in one, that the scan never enters.
const SKIPPED_DIR = /(?:^|\/)(?:node_modules|\.git|\.worktrees|dist|\.tmp|\.repo)$/;

/** One product: `name` is its config's directory relative to the scan root, posix (`.` at the root). */
export type Product = {
  /** The config's directory relative to the scan root, in posix form. */
  name: string;
  /** The absolute path of the product root. */
  root: string;
  /** The absolute path of the product's `infra.config.ts`. */
  configFile: string;
  /** The product's parsed config. */
  config: InfraConfig;
};

/** The outcome of choosing products: the chosen ones, or the reason none could be chosen. */
export type Selection =
  | {
      /** Marks a successful choice. */
      ok: true;
      /** The chosen products. */
      products: Product[];
    }
  | {
      /** Marks a failed choice. */
      ok: false;
      /** Says why no product could be chosen. */
      error: string;
    };

/** Which products a command acts on: all, one by name, or `undefined` to infer from the working directory. */
export type ProductTarget =
  | {
      /** Selects every product. */
      all: true;
    }
  | {
      /** The name of the one product to select. */
      name: string;
    }
  | undefined;

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
  const name = posixRelative(root, dir);

  // The kit learns where it lives, so every command that reads a Worker config finds the product's rate-limit ids.
  if (isCfKit(loaded.default)) loaded.default[PRODUCT_ROOT](dir);

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
