import type { DEPLOY_SCOPES } from "./deploy-scopes.constants.ts";

/** A scope a Worker deploys to. */
export type DeployScope = (typeof DEPLOY_SCOPES)[number];
