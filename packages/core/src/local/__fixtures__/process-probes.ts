import { setTimeout as sleep } from "node:timers/promises";

import type { Child } from "../child.ts";
import { membersOf } from "../members-of.ts";
import { readProcessTable } from "../read-process-table.ts";
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

/** The pids in a process group (on win32, a process and its descendants). */
export function groupPids(pgid: number): number[] {
  return membersOf(readProcessTable(), pgid).map((row) => row.pid);
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
