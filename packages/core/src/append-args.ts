import type { PeerProgram } from "./peer-program.ts";

/** The program with `args` after the ones it already has (the bin path a peer program starts with). */
export function appendArgs(program: PeerProgram, args: readonly string[]): PeerProgram {
  return { args: [...program.args, ...args], file: program.file };
}
