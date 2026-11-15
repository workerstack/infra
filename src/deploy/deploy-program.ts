import { peerBin } from "../peer-bin.ts";
import type { DeployTool } from "./deploy-tool.ts";

const JS_FILE = /\.[cm]?js$/;

export type DeployProgram = { args: string[]; file: string };

/** The program for `tool`: `bun` from the path, `cf` and `wrangler` as the peer packages installed for `root`. */
export function deployProgram(root: string, tool: DeployTool, args: string[]): DeployProgram {
  if (tool === "bun") return { args, file: "bun" };

  const file = peerBin(root, tool, tool);

  return JS_FILE.test(file) ? { args: [file, ...args], file: process.execPath } : { args, file };
}
