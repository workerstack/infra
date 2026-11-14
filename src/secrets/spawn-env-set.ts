import { spawn } from "node:child_process";

import type { EnvSetCall } from "./env-set-call.ts";

/** Runs the call with the value piped to stdin and stdout and stderr inherited; resolves with the exit code. */
export function spawnEnvSet(call: EnvSetCall): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(call.command, call.args, { cwd: call.cwd, stdio: ["pipe", "inherit", "inherit"] });

    child.once("error", reject);
    child.once("close", (code) => resolve(code ?? 1));
    child.stdin.end(call.stdin);
  });
}
