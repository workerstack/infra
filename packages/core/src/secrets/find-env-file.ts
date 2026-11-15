import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { Product } from "../products.ts";
import type { InfraEnv } from "../schema/infra.ts";
import { ENV_SCAN_SKIP } from "./env-scan-skip.constants.ts";

/** The absolute path of the file under the product root that calls `defineEnv(` and exports the config's env. */
export async function findEnvFile(product: Product): Promise<string | undefined> {
  const files = globSync("**/*.ts", { cwd: product.root, exclude: (entry) => ENV_SCAN_SKIP.test(entry) })
    .map((file) => join(product.root, file))
    .filter((file) => readFileSync(file, "utf8").includes("defineEnv("));

  const matches = await Promise.all(files.map((file) => exportsEnv(file, product)));

  return files.find((_, index) => matches[index] === true);
}

// Loading the module reads no value: an env file defines its views and resolves them when a key is read.
async function exportsEnv(file: string, product: Product): Promise<boolean> {
  const loaded = await (import(pathToFileURL(file).href) /* an env file module */ as Promise<Record<string, InfraEnv>>);

  return Object.values(loaded).some((value) => value === product.config.env);
}
