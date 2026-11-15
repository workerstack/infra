import { relative, sep } from "node:path";

import type { WorkerTarget } from "../workers/worker-target.ts";
import type { DeployRun } from "./deploy-run.ts";

const PROD = "prod";

function listsLocale({ worker }: WorkerTarget): boolean {
  const dir = relative(worker.product.root, worker.packageDir).split(sep).join("/");

  return worker.product.config.cloudflare?.zone.redirects.locale.includes(dir) ?? false;
}

/**
 * A prod app its zone lists sends visitors on with rules built from the record just built, so they reach the zone
 * before the Worker that answers behind them.
 */
export async function setLocaleRedirects(target: WorkerTarget, run: DeployRun): Promise<void> {
  if (run.scope !== PROD || !listsLocale(target)) return;

  const { product } = target.worker;
  const descriptions = await run.io.setRedirects(product);

  run.io.print(`${product.name}: redirect rules ${descriptions.join(", ")}`);
}
