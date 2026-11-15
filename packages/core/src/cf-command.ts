import { peerBin } from "./peer-bin.ts";

const JS_FILE = /\.[cm]?js$/;

export type Program = { args: string[]; file: string };

/** The `cf` binary of the package installed for `root`, as a program to spawn with `args` after it. */
export function cfCommand(root: string, args: readonly string[], execPath: string): Program {
  const file = peerBin(root, "cf", "cf");

  return JS_FILE.test(file) ? { args: [file, ...args], file: execPath } : { args: [...args], file };
}
