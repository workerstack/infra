import { resolve } from "node:path";

import { posixRelative } from "../shared/posix-relative.ts";
import type { DeployScope } from "./deploy-scope.ts";
import { targetOf } from "./target-of.ts";
import type { TargetResult } from "./target-result.ts";
import type { WorkerCatalog } from "./worker-catalog.ts";
import type { WorkerRecord } from "./worker-record.ts";
import type { WorkerTarget } from "./worker-target.ts";

// `asDir` is the selector read as a package dir from the root.
function matches(worker: WorkerRecord, selector: { asDir: string; text: string }, scope: DeployScope): boolean {
  return (
    worker.product.name === selector.text ||
    worker.dir === selector.asDir ||
    worker.baseName === selector.text ||
    worker.scopes[scope]?.scriptName === selector.text
  );
}

function pick(catalog: WorkerCatalog, selector: string, scope: DeployScope): TargetResult {
  const asDir = posixRelative(catalog.root, resolve(catalog.root, selector));
  const found = catalog.workers.filter((worker) => matches(worker, { asDir, text: selector }, scope));

  if (found.length === 0) {
    const known = catalog.workers.map((worker) => `${worker.baseName} (${worker.dir})`).join("\n  ");

    return { error: `No worker matches "${selector}". Known:\n  ${known}`, ok: false };
  }

  const targets = found.flatMap((worker) => targetOf(worker, scope) ?? []);

  if (targets.length === 0)
    return { error: `"${selector}" names only Workers that never deploy to ${scope}`, ok: false };

  return { ok: true, targets };
}

/**
 * Each selector is a product name (every Worker in it), a package dir (taken from the root), a base name or a
 * script name in `scope`. A selector that matches nothing fails with the catalog; one that matches only Workers
 * that never deploy to `scope` fails naming it. A Worker picked twice is picked once, by script name.
 */
export function resolveWorkers(catalog: WorkerCatalog, selectors: string[], scope: DeployScope): TargetResult {
  const picked = new Map<string, WorkerTarget>();

  for (const selector of selectors) {
    const result = pick(catalog, selector, scope);

    if (!result.ok) return result;

    for (const target of result.targets) picked.set(target.scriptName, target);
  }

  return { ok: true, targets: [...picked.values()] };
}
