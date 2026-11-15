import type { Product } from "../products.ts";
import type { DeployScope } from "./deploy-scope.ts";
import type { WorkerScope } from "./worker-scope.ts";

/** A Worker package of a product, read from its `cloudflare.config.ts`. */
export type WorkerRecord = {
  /** The Worker's name without its scope suffix. */
  baseName: string;
  /** The package dir relative to the root, posix. */
  dir: string;
  /** The package dir, absolute. */
  packageDir: string;
  product: Product;
  /** The scopes its kit deploys to; a scope the kit lacks has no entry. */
  scopes: Partial<Record<DeployScope, WorkerScope>>;
};
