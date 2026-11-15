import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { stringifyJson } from "../shared/jsonc.ts";
import { writeAtomic } from "../shared/write-atomic.ts";
import type { LockedChild } from "./locked-child.ts";

/** Records the children a stack started, so the next start can stop whatever a `kill -9` left running. */
export function writeLock(file: string, children: readonly LockedChild[]): void {
  const entries = children.map(({ cmdline, pgid, pid, start }) => ({ cmdline, pgid, pid, start }));

  mkdirSync(dirname(file), { recursive: true });
  writeAtomic(file, stringifyJson({ children: entries }));
}
