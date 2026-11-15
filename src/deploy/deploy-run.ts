import type { DeployScope } from "../workers/deploy-scope.ts";
import type { ChildOptions } from "./child-options.ts";
import type { DeployIo } from "./deploy-io.ts";

/** One Worker's deploy: the edges, its child's dir and env, the scope and the prune flag. */
export type DeployRun = { child: ChildOptions; io: DeployIo; prune: boolean; scope: DeployScope };
