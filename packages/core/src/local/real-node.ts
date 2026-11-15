import { accessSync, constants, realpathSync } from "node:fs";
import { delimiter, join, parse } from "node:path";

import { nodeChildEnv } from "../cf-config/node-child-env.ts";
import { BUN_BINARY, WIN32 } from "./local.constants.ts";

function isRealNode(candidate: string, platform: NodeJS.Platform): boolean {
  try {
    if (platform !== WIN32) accessSync(candidate, constants.X_OK);

    return parse(realpathSync(candidate)).name !== BUN_BINARY;
  } catch {
    return false;
  }
}

/** Node from the child PATH, past any `node` that is Bun: wrangler cannot forward requests to a Worker under Bun. */
export function realNode(platform: NodeJS.Platform = process.platform): string {
  const name = platform === WIN32 ? "node.exe" : "node";
  const dirs = nodeChildEnv().PATH?.split(delimiter) ?? [];
  const found = dirs.map((dir) => join(dir, name)).find((candidate) => isRealNode(candidate, platform));

  if (found === undefined) throw new Error("the local stack runs wrangler under Node, and no node is on PATH");

  return found;
}
