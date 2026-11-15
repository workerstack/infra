import { readdirSync, readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

import type { Child } from "../child.ts";
import { spawnGroup } from "../spawn-group.ts";
import { stopGroups } from "../stop-groups.ts";

/** Whether a pid is a live process. */
export function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);

    return true;
  } catch {
    return false;
  }
}

/** The pids in a process group, from /proc. */
export function groupPids(pgid: number): number[] {
  return readdirSync("/proc")
    .filter((entry) => /^\d+$/.test(entry))
    .filter((pid) => {
      try {
        const stat = readFileSync(`/proc/${pid}/stat`, "utf8");

        return Number(stat.slice(stat.lastIndexOf(")") + 2).split(" ")[2]) === pgid;
      } catch {
        return false;
      }
    })
    .map(Number);
}

/** Resolves once `check` holds, or after 5 s. */
export async function until(check: () => boolean, left = 100): Promise<void> {
  if (left === 0 || check()) return;

  await sleep(50);
  await until(check, left - 1);
}

/** `sh -c script` as a quiet group child; `stopStarted` stops every one started. */
export function shellGroups() {
  const started: Child[] = [];

  return {
    start: async (name: string, script: string) => {
      const child = await spawnGroup({ cmd: ["sh", "-c", script], cwd: "/", env: process.env, name, onLine: () => {} });

      started.push(child);

      return child;
    },
    stopStarted: () => stopGroups(started.splice(0)),
  };
}
