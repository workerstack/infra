import type { DeployScope } from "../workers/deploy-scope.ts";
import { resolveWorkers } from "../workers/resolve-workers.ts";
import type { TargetResult } from "../workers/target-result.ts";
import type { LogsHost } from "./logs-host.ts";

/** Runs the guard, then picks the Workers the selectors name in `scope`; the guard throws under a test runner. */
export async function pickTargets(host: LogsHost, selectors: string[], scope: DeployScope): Promise<TargetResult> {
  host.guard();

  return resolveWorkers(await host.load(host.root(host.cwd)), selectors, scope);
}
