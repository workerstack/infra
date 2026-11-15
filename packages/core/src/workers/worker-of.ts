import { dirname } from "node:path";

import type { CfConfig } from "../cf-config/cf-config.ts";
import type { Product } from "../products.ts";
import type { DeployScope } from "./deploy-scope.ts";
import type { WorkerRecord } from "./worker-record.ts";
import type { WorkerScope } from "./worker-scope.ts";

/** What was read of one Worker package: its place and its config in each scope its kit deploys to. */
type WorkerRead = {
  /** The package dir relative to the root. */
  dir: string;
  file: string;
  product: Product;
  read: { config: CfConfig; scope: DeployScope }[];
};

/** The record for a package: the kit names a Worker `<base>-<scope>`, so a scope's name gives the base. */
export function workerOf(input: WorkerRead): WorkerRecord {
  const scopes: Partial<Record<DeployScope, WorkerScope>> = {};

  for (const { config, scope } of input.read) {
    const observability = config.wrangler["observability"];

    scopes[scope] = { scriptName: config.worker.name, ...(observability !== undefined && { observability }) };
  }

  const [first] = input.read;
  const suffix = first === undefined ? "" : `-${first.scope}`;
  const name = first?.config.worker.name ?? "";

  return {
    baseName: name.endsWith(suffix) ? name.slice(0, name.length - suffix.length) : name,
    dir: input.dir,
    packageDir: dirname(input.file),
    product: input.product,
    scopes,
  };
}
