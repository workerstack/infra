import type { DeployScope } from "../workers/deploy-scope.ts";

/** What `infra deploy`'s command line says: the Worker selectors, the scope and the prune flag. */
export type DeployArgs = { prune: boolean; scope: DeployScope; selectors: string[] };
