import type { Product } from "../products.ts";

/** One command: its name, the work per product (given the repo root), and the line printed when all passed. */
export type CommandSpec = {
  done?: string;
  name: string;
  work: (product: Product, root: string) => Promise<void>;
};
