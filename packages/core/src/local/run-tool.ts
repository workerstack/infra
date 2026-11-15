import { execFileSync } from "node:child_process";

import type { ChildEnv } from "../child-env.ts";
import { env as processEnv } from "../env.ts";
import { TOOL_MAX_BUFFER, TOOL_TIMEOUT_MS } from "./local.constants.ts";
import { readOrUndefined } from "./read-or-undefined.ts";

/** What a tool prints, or `undefined` when it is missing, fails or times out; `env` adds to this process's. */
export function runTool(command: string, args: readonly string[], env: ChildEnv = {}): string | undefined {
  return readOrUndefined(() =>
    execFileSync(command, args, {
      encoding: "utf8",
      env: { ...processEnv, ...env },
      maxBuffer: TOOL_MAX_BUFFER,
      stdio: ["ignore", "pipe", "ignore"],
      timeout: TOOL_TIMEOUT_MS,
      windowsHide: true,
    }),
  );
}
