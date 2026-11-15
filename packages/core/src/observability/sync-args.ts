import type { DeployScope } from "../workers/deploy-scope.ts";

/** What `infra observability-sync` was asked, or the lines saying why not. */
export type SyncArgs =
  | { apply: boolean; ok: true; scope: DeployScope; selectors: string[] }
  | { message: string; ok: false };
