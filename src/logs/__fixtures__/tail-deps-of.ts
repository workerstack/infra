import { wranglerEnv } from "../../wrangler-env.ts";
import type { TailDeps } from "../tail-deps.ts";
import type { TailSpawn } from "../tail-spawn.ts";

/** Tail deps over a fake spawn: wrangler is `wrangler.js` under `node`, and the env is `wranglerEnv` on an empty base. */
export function tailDepsOf(spawn: TailSpawn): TailDeps {
  return {
    childEnv: (env) => wranglerEnv(env, {}),
    program: (_root, args) => ({ args: ["wrangler.js", ...args], file: "node" }),
    spawn,
  };
}
