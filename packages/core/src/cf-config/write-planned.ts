import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";

import { writeAtomic } from "../shared/write-atomic.ts";
import { isGeneratedDevVars } from "./is-generated-dev-vars.ts";
import type { PlannedFile } from "./planned-file.ts";

function writeOne({ file, text }: PlannedFile): boolean {
  if (text === undefined) {
    // A scope that drops its last secret leaves no generated file behind; a hand-written one stays.
    if (!existsSync(file) || !isGeneratedDevVars(file)) return false;

    rmSync(file);

    return true;
  }

  if (existsSync(file) && readFileSync(file, "utf8") === text) return false;

  mkdirSync(dirname(file), { recursive: true });
  writeAtomic(file, text);

  return true;
}

/** Brings each planned file to its text, or removes a generated one that should be gone; answers the changed ones. */
export function writePlanned(planned: readonly PlannedFile[]): string[] {
  return planned.filter((one) => writeOne(one)).map(({ file }) => file);
}
