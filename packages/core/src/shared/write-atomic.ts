import { renameSync, writeFileSync } from "node:fs";

/** Replaces a file in one step: a reader sees the old text or the new, never half of it. */
export function writeAtomic(target: string, text: string): void {
  const temp = `${target}.${process.pid}.tmp`;

  writeFileSync(temp, text);
  renameSync(temp, target);
}
