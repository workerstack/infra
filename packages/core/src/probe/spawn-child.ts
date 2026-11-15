import { spawn } from "node:child_process";

import type { SpawnOutput } from "./spawn-output.ts";

/** Runs a system binary and collects its output; a binary that cannot start rejects. */
export function spawnChild(cmd: string[]): Promise<SpawnOutput> {
  return new Promise((resolve, reject) => {
    const [file = "", ...args] = cmd;
    const child = spawn(file, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.once("error", reject);
    child.once("close", (code) => {
      resolve({ exitCode: code ?? 1, stderr, stdout });
    });
  });
}
