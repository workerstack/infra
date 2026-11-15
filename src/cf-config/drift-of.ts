import { existsSync, readFileSync } from "node:fs";

import { isGeneratedDevVars } from "./is-generated-dev-vars.ts";
import type { PlannedFile } from "./planned-file.ts";

function drifted({ file, text }: PlannedFile): boolean {
  if (text === undefined) return existsSync(file) && isGeneratedDevVars(file);

  return !existsSync(file) || readFileSync(file, "utf8") !== text;
}

/** The planned files whose text on disk is not what `infra gen` would write. */
export function driftOf(planned: readonly PlannedFile[]): string[] {
  return planned.filter((one) => drifted(one)).map(({ file }) => file);
}
