import { wranglerEnv } from "../wrangler-env.ts";
import { realTailSpawn } from "./real-tail-spawn.ts";
import type { TailDeps } from "./tail-deps.ts";
import { wranglerCommand } from "./wrangler-command.ts";

/** The deps `infra logs-tail` runs with: the product's wrangler env, the installed wrangler and a real child. */
export function realTailDeps(): TailDeps {
  return {
    childEnv: (env) => wranglerEnv(env),
    program: (root, args) => wranglerCommand(root, args, process.execPath),
    spawn: realTailSpawn,
  };
}
