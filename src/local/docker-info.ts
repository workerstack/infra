import { spawnSync } from "node:child_process";

import type { DockerAnswer } from "./stack-options.ts";

/** Whether `docker info` answers, else its last line of complaint. */
export function dockerInfo(): DockerAnswer {
  const result = spawnSync("docker", ["info"], { encoding: "utf8" });

  if (result.status === 0) return { ok: true };

  const said = result.stderr === "" ? (result.error?.message ?? "") : result.stderr;

  return { ok: false, reason: said.trim().split("\n").pop() ?? "" };
}
