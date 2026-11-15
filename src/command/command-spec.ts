import type { Product } from "../products.ts";

/** One command: its name, extra usage flags, the work per product (given the repo root) and the done line. */
export type CommandSpec = {
  done?: string;
  name: string;
  /** The flags the usage line shows after `[name|--all]`. */
  usageFlags?: string;
  work: (product: Product, root: string) => Promise<void>;
};
