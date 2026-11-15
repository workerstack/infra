import { readdirSync, readFileSync, rmSync } from "node:fs";

import { cmdlineOf } from "./cmdline-of.ts";
import { PID_ENTRY } from "./local.constants.ts";
import { type LockedChild, lockSchema } from "./locked-child.ts";
import { procStat } from "./proc-stat.ts";
import { readOrUndefined } from "./read-or-undefined.ts";
import { stopGroups } from "./stop-groups.ts";

// A live group member started at or after the leader: a group's members all start after its leader, while the
// leader's pid, once free, can lead a stranger's group only after all of them exited.
function hasMembersSince(pgid: number, since: number): boolean {
  return readdirSync("/proc")
    .filter((entry) => PID_ENTRY.test(entry))
    .some((entry) => {
      const stat = procStat(Number(entry));

      return stat !== undefined && stat.pgrp === pgid && stat.start >= since;
    });
}

// A live leader is the recorded one only with the same command line and start time; a gone one left its members.
function isOrphan(child: LockedChild): boolean {
  const leader = cmdlineOf(child.pid);

  if (leader === undefined) return hasMembersSince(child.pgid, child.start);

  return leader === child.cmdline && procStat(child.pid)?.start === child.start;
}

function parseLock(file: string, text: string): LockedChild[] {
  const children = readOrUndefined(() => lockSchema().parse(JSON.parse(text)).children);

  if (children === undefined) throw new Error(`${file} is not a stack lock; delete it after checking no stack runs`);

  return children;
}

/**
 * Stops what a previous run of this stack left behind, then drops its lock: only a group whose leader is still the
 * recorded process, or whose leader exited and left members started since. Nothing else is touched.
 */
export async function clearOrphans(file: string): Promise<void> {
  const text = readOrUndefined(() => readFileSync(file, "utf8"));

  if (text === undefined) return;

  await stopGroups(parseLock(file, text).filter((child) => isOrphan(child)));
  rmSync(file, { force: true });
}
