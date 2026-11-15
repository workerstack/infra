import { readFileSync } from "node:fs";

import { DEV_VARS_HEADER } from "./cf-config.constants.ts";

/** Whether `infra gen` wrote a `.dev.vars` file: a hand-written one stays, only a generated one is its to remove. */
export function isGeneratedDevVars(file: string): boolean {
  return readFileSync(file, "utf8").startsWith(DEV_VARS_HEADER);
}
