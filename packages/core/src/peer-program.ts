import { closeSync, openSync, readSync } from "node:fs";

import { realNode } from "./local/real-node.ts";
import { peerBin } from "./peer-bin.ts";

const SHEBANG_BYTES = 256;
const BUN_SHEBANG = /(^|[\s/\\])bun(\.exe)?(\s|$)/;
const NODE_SHEBANG = /(^|[\s/\\])node(\.exe)?(\s|$)/;
const LINE_BREAK = /\r?\n/;
const SCRIPT_FILE = /\.[cm]?[jt]s$/;

export type PeerProgram = { args: string[]; file: string };

// The first line of the file, which is all a shebang is.
function firstLine(path: string): string {
  const descriptor = openSync(path, "r");

  try {
    const buffer = Buffer.alloc(SHEBANG_BYTES);
    const read = readSync(descriptor, buffer, 0, SHEBANG_BYTES, 0);

    return buffer.toString("utf8", 0, read).split(LINE_BREAK)[0] ?? "";
  } finally {
    closeSync(descriptor);
  }
}

function runtimeOf(path: string, line: string): string | undefined {
  if (!line.startsWith("#!")) return SCRIPT_FILE.test(path) ? process.execPath : undefined;

  if (BUN_SHEBANG.test(line)) return process.execPath;

  return NODE_SHEBANG.test(line) ? realNode() : undefined;
}

/**
 * The program that runs `bin` of the `pkg` package installed for `root`: the runtime its first line or extension
 * names, with the bin path as the first arg, so the bin file itself is never spawned (it cannot be on Windows).
 */
export function peerProgram(root: string, pkg: string, bin: string): PeerProgram {
  const path = peerBin(root, pkg, bin);
  const file = runtimeOf(path, firstLine(path));

  if (file === undefined)
    throw new Error(`${pkg} ${bin} (${path}) has no runtime infra knows; it runs under node or bun`);

  return { args: [path], file };
}
