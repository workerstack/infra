import { delimiter } from "node:path";

import type { ChildEnv } from "../child-env.ts";
import { env } from "../env.ts";

// The directory `bun --bun` puts first on PATH, whose `node` is Bun itself.
const BUN_NODE_SHIM = /bun-node/;

/**
 * The env for a child that must run under real Node (`cf workers types` refuses Bun): the process env with the
 * directory of Bun's `node` shim, which `bun --bun` puts on PATH, taken out of PATH.
 */
export function nodeChildEnv(): ChildEnv {
  const path = env.PATH?.split(delimiter).filter((dir) => !BUN_NODE_SHIM.test(dir));

  return { ...env, PATH: path?.join(delimiter) };
}
