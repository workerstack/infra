import type { DeployProgram } from "../deploy/deploy-program.ts";
import { peerBin } from "../peer-bin.ts";
import type { DbTool } from "./db-io.ts";

const SCRIPT_FILE = /\.[cm]?[jt]s$/;

/** The program for `tool`: the peer package installed for `root`, a script run by the current runtime. */
export function dbProgram(root: string, tool: DbTool, args: string[]): DeployProgram {
  const file = peerBin(root, tool === "database" ? "@workerstack/database" : tool, tool);

  return SCRIPT_FILE.test(file) ? { args: [file, ...args], file: process.execPath } : { args, file };
}
