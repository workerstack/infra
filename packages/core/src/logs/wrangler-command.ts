import type { Program } from "../cf-command.ts";
import { peerBin } from "../peer-bin.ts";

const JS_FILE = /\.[cm]?js$/;

/** The `wrangler` binary of the package installed for `root`, as a program to spawn with `args` after it. */
export function wranglerCommand(root: string, args: readonly string[], execPath: string): Program {
  const file = peerBin(root, "wrangler", "wrangler");

  return JS_FILE.test(file) ? { args: [file, ...args], file: execPath } : { args: [...args], file };
}
