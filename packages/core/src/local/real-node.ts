import { accessSync, constants, realpathSync } from "node:fs";
import { basename, delimiter, join } from "node:path";

import { nodeChildEnv } from "../cf-config/node-child-env.ts";
import { BUN_BINARY } from "./local.constants.ts";

function isRealNode(candidate: string): boolean {
  try {
    accessSync(candidate, constants.X_OK);

    return basename(realpathSync(candidate)) !== BUN_BINARY;
  } catch {
    return false;
  }
}

/** Node from the child PATH, past any `node` that is Bun: wrangler cannot forward requests to a Worker under Bun. */
export function realNode(): string {
  const dirs = nodeChildEnv().PATH?.split(delimiter) ?? [];
  const found = dirs.map((dir) => join(dir, "node")).find((candidate) => isRealNode(candidate));

  if (found === undefined) throw new Error("the local stack runs wrangler under Node, and no node is on PATH");

  return found;
}
