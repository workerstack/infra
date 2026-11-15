import type { BundlerSettings } from "../cf-config/bundler-settings.ts";
import type { InfraScope } from "../schema/infra.ts";
import type { WORKER_BUILD } from "./cf-kit.constants.ts";

/** What `infra.worker` returns beside the config function: the build settings its options set, per scope. */
export type WorkerBuild = { readonly [WORKER_BUILD]: (scope: InfraScope) => BundlerSettings };
