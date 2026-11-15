import { readFileSync } from "node:fs";

import { TRAILING_NUL } from "./local.constants.ts";
import { readOrUndefined } from "./read-or-undefined.ts";

/** A process's /proc cmdline, NUL-separated without the last NUL; `undefined` once it is gone. */
export function cmdlineOf(pid: number): string | undefined {
  return readOrUndefined(() => readFileSync(`/proc/${pid}/cmdline`, "utf8").replace(TRAILING_NUL, ""));
}
