import type { DeployScope } from "../workers/deploy-scope.ts";
import type { WorkerTarget } from "../workers/worker-target.ts";

/** What `infra deploy` was asked: the Workers, the scope, and whether to delete undeclared secrets. */
export type DeployRequest = { prune: boolean; scope: DeployScope; targets: WorkerTarget[] };
