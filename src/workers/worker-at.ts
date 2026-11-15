import { isAbsolute, relative, resolve, sep } from "node:path";

import type { DeployScope } from "./deploy-scope.ts";
import { targetOf } from "./target-of.ts";
import type { TargetResult } from "./target-result.ts";
import type { WorkerCatalog } from "./worker-catalog.ts";

function holds(packageDir: string, dir: string): boolean {
  const path = relative(packageDir, dir);

  return path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

/** The Worker whose package holds `dir` (a relative `dir` is taken from the root), for a deploy that names none. */
export function workerAt(catalog: WorkerCatalog, dir: string, scope: DeployScope): TargetResult {
  const target = resolve(catalog.root, dir);
  const [worker] = catalog.workers.filter((candidate) => holds(candidate.packageDir, target));
  const found = worker === undefined ? undefined : targetOf(worker, scope);

  if (worker === undefined) return { error: "no Worker package holds the current dir; name a Worker", ok: false };

  if (found === undefined) return { error: `${worker.dir} never deploys to ${scope}`, ok: false };

  return { ok: true, targets: [found] };
}
