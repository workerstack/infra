import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { stringifyJson } from "../shared/jsonc.ts";
import { writeAtomic } from "../shared/write-atomic.ts";

/** Names the running stack in its state file, which `readLocalStack` reads: the origin and this launcher's pid. */
export function writeStackFile(file: string, origin: string): void {
  mkdirSync(dirname(file), { recursive: true });
  writeAtomic(file, stringifyJson({ origin, pid: process.pid, startedAt: new Date().toISOString() }));
}
