import { relative } from "node:path";
import { pathToFileURL } from "node:url";

import type { CfKit } from "../cf-kit/cf-kit.ts";
import { isCfKit } from "../cf-kit/is-cf-kit.ts";
import { CF_KIT_SUFFIX } from "./cf-config.constants.ts";
import { findInProduct } from "./find-in-product.ts";

function kitFileOf(productRoot: string): string {
  const files = findInProduct(productRoot, `**/*${CF_KIT_SUFFIX}`);
  const [file, extra] = files;

  if (file === undefined) throw new Error(`no *${CF_KIT_SUFFIX}; a product with Workers has one`);

  if (extra !== undefined) {
    const names = files.map((found) => relative(productRoot, found)).join(", ");

    throw new Error(`${files.length} kits (${names}); a product has one`);
  }

  return file;
}

/**
 * The kit the product's one `*.cf-kit.ts` exports. No kit file, two of them, or a file that exports no kit or
 * two fails naming the file.
 */
export async function loadProductKit(productRoot: string): Promise<CfKit> {
  const file = kitFileOf(productRoot);
  const shown = relative(productRoot, file);
  const loaded = await (import(pathToFileURL(file).href) /* a module namespace is an object */ as Promise<object>);
  const kits = [...new Set(Object.values(loaded).filter(isCfKit))];

  const [kit, other] = kits;

  if (kit === undefined) throw new Error(`${shown} exports no kit; export createCfKit({ ... })`);

  if (other !== undefined) throw new Error(`${shown} exports ${kits.length} kits; a kit file exports one`);

  return kit;
}
