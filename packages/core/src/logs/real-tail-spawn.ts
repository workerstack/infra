import { spawn } from "node:child_process";

import { FAILURE_EXIT } from "../failure-exit.constants.ts";
import type { TailChild } from "./tail-child.ts";
import type { TailLaunch } from "./tail-launch.ts";

/** Starts the tail as a child process whose streams read as text. */
export function realTailSpawn(launch: TailLaunch): TailChild {
  const child = spawn(launch.file, launch.args, {
    cwd: launch.cwd,
    env: launch.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");

  const exited = new Promise<number>((done, fail) => {
    child.on("error", fail);
    child.on("close", (code) => {
      done(code ?? FAILURE_EXIT);
    });
  });

  return {
    exited,
    kill: () => {
      child.kill();
    },
    stderr: child.stderr,
    stdout: child.stdout,
  };
}
