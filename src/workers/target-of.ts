import type { DeployScope } from "./deploy-scope.ts";
import type { WorkerRecord } from "./worker-record.ts";
import type { WorkerTarget } from "./worker-target.ts";

/** The worker in `scope`; `undefined` when its kit never deploys there. */
export function targetOf(worker: WorkerRecord, scope: DeployScope): WorkerTarget | undefined {
  const found = worker.scopes[scope];

  if (found === undefined) return undefined;

  return {
    scriptName: found.scriptName,
    worker,
    ...(found.observability !== undefined && { observability: found.observability }),
  };
}
