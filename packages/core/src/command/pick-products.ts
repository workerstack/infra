import type { Product, ProductTarget, Selection } from "../products.ts";
import { productAt, selectProducts } from "../products.ts";

/** What to pick from: the scan root, its products and the current dir. */
export type Pick = { cwd: string; products: Product[]; root: string };

/** The named or `--all` products; with no target, the product holding the current dir, else the only product. */
export function pickProducts(pick: Pick, target: ProductTarget): Selection {
  const { cwd, products, root } = pick;

  if (target !== undefined) return selectProducts(root, products, target);

  const here = productAt(root, products, cwd);

  return here.ok ? here : selectProducts(root, products, undefined);
}
