import type { Program } from "../cf-command.ts";
import type { ChildEnv } from "../child-env.ts";
import type { InfraEnv } from "../schema/infra.ts";
import type { TailSpawn } from "./tail-spawn.ts";

/** What `infra logs-tail` reaches outside itself through: the child's env, the wrangler program and the spawn. */
export type TailDeps = {
  childEnv: (env: InfraEnv) => ChildEnv;
  program: (root: string, args: string[]) => Program;
  spawn: TailSpawn;
};
