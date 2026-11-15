import { spawn } from "node:child_process";

import type { ChildOptions } from "../deploy/child-options.ts";
import { FAILURE_EXIT } from "../failure-exit.constants.ts";
import type { PeerProgram } from "../peer-program.ts";
import type { DbRun } from "./db-io.ts";

/** Runs the program with stdin closed and resolves to its exit code (a signal is 1) and both streams. */
export function runDbChild(program: PeerProgram, child: ChildOptions): Promise<DbRun> {
  return new Promise((done, fail) => {
    const spawned = spawn(program.file, program.args, {
      cwd: child.cwd,
      env: child.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    let stdout = "";

    spawned.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    spawned.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    spawned.on("error", fail);
    spawned.on("close", (code) => {
      done({ code: code ?? FAILURE_EXIT, stderr, stdout });
    });
  });
}
