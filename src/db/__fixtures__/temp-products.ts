import { afterEach } from "vitest";

import type { Product } from "../../products.ts";
import { type TempProduct, tempProduct } from "./temp-product.ts";

/** A maker of temp fixture products holding `schema`; every one it made is removed after each test. */
export function tempProducts(schema: string): () => Product {
  const made: TempProduct[] = [];

  afterEach(() => {
    for (const temp of made.splice(0)) temp.remove();
  });

  return () => {
    const temp = tempProduct(schema);

    made.push(temp);

    return temp.product;
  };
}
