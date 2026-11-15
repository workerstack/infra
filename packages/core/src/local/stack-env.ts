import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { nodeChildEnv } from "../cf-config/node-child-env.ts";
import type { ChildEnv } from "../child-env.ts";
import { REGISTRY_DIR, REGISTRY_ENV_KEYS, TEMP_DIR, TEMP_ENV_KEYS } from "./local.constants.ts";

/** What the stack's children share: the env, with the stack's own dev registry, and the registry's path. */
export type StackEnv = { env: ChildEnv; registry: string };

/**
 * The children's env: the process env without Bun's `node` shim, so wrangler and Vite run under Node, and a dev
 * registry of the stack's own, so no other `wrangler dev` on the machine reaches its Workers, and a temp dir of the
 * stack's own, which a stop removes whatever its children left there.
 */
export function stackEnv(productRoot: string): StackEnv {
  const registry = join(productRoot, REGISTRY_DIR);

  const temp = join(productRoot, TEMP_DIR);

  mkdirSync(registry, { recursive: true });
  mkdirSync(temp, { recursive: true });

  return {
    env: {
      ...nodeChildEnv(),
      ...Object.fromEntries(REGISTRY_ENV_KEYS.map((key) => [key, registry])),
      ...Object.fromEntries(TEMP_ENV_KEYS.map((key) => [key, temp])),
    },
    registry,
  };
}
