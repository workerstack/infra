import type { DeployScope } from "./deploy-scope.ts";
import { DEPLOY_SCOPES } from "./deploy-scopes.constants.ts";

/** The deploy scope a `--scope` value names; `undefined` for anything else, `local` included. */
export function parseDeployScope(value: string | undefined): DeployScope | undefined {
  return DEPLOY_SCOPES.find((scope) => scope === value);
}
