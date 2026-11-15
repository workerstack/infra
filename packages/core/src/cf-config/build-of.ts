import { WORKER_BUILD } from "../cf-kit/cf-kit.constants.ts";
import type { WorkerBuild } from "../cf-kit/worker-build.ts";
import type { InfraScope } from "../schema/infra.ts";
import type { BundlerSettings } from "./bundler-settings.ts";

/** The build settings `infra.worker` put on a default export for `scope`; `{}` for an export without them. */
export function buildOf(exported: Partial<WorkerBuild>, scope: InfraScope): BundlerSettings {
  return exported[WORKER_BUILD]?.(scope) ?? {};
}
