import { spawn } from "node:child_process";
import type { StdioOptions } from "node:child_process";

import { FAILURE_EXIT } from "../failure-exit.constants.ts";
import type { ChildOptions } from "./child-options.ts";
import type { DeployProgram } from "./deploy-program.ts";

/**
 * Runs the program and resolves to its exit code (a signal is 1). With `capture`, stdin is closed and stdout is
 * read; otherwise the child shares the terminal.
 */
export function runChild(
  program: DeployProgram,
  child: ChildOptions,
  options: { capture: boolean },
): Promise<{ code: number; stdout: string }> {
  return new Promise((done, fail) => {
    const stdio: StdioOptions = options.capture ? ["ignore", "pipe", "inherit"] : ["inherit", "inherit", "inherit"];
    const spawned = spawn(program.file, program.args, { cwd: child.cwd, env: child.env, stdio });
    let stdout = "";

    spawned.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    spawned.on("error", fail);
    spawned.on("close", (code) => {
      done({ code: code ?? FAILURE_EXIT, stdout });
    });
  });
}
