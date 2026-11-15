import type { DeployScope } from "../workers/deploy-scope.ts";

/** What `infra logs-tail` was asked: the Workers, the scope, the minutes and the wrangler filters. */
export type TailArgs = {
  minutes: number;
  passThrough: string[];
  scope: DeployScope;
  selectors: string[];
};
