import { setTimeout as sleep } from "node:timers/promises";

import type { Child } from "./child.ts";
import { ERRNO_NO_PROCESS, STOP_GRACE_MS, STOP_POLL_MS } from "./local.constants.ts";

// Whether any process is left in the group; another user's live group counts.
function groupAlive(pgid: number): boolean {
  try {
    process.kill(-pgid, 0);

    return true;
  } catch (error) {
    return !(error instanceof Error && "code" in error && error.code === ERRNO_NO_PROCESS);
  }
}

function signalGroup(pgid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pgid, signal);
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === ERRNO_NO_PROCESS)) throw error;
  }
}

async function waitGone(pgids: readonly number[], deadline: number): Promise<number[]> {
  const left = pgids.filter((pgid) => groupAlive(pgid));

  if (left.length === 0 || Date.now() >= deadline) return left;

  await sleep(STOP_POLL_MS);

  return waitGone(left, deadline);
}

/** SIGTERM each group, then SIGKILL whatever is left after the grace period. */
export async function stopGroups(
  children: readonly Pick<Child, "pgid">[],
  graceMs: number = STOP_GRACE_MS,
): Promise<void> {
  const pgids = children.map((child) => child.pgid);

  for (const pgid of pgids) signalGroup(pgid, "SIGTERM");

  const left = await waitGone(pgids, Date.now() + graceMs);

  for (const pgid of left) signalGroup(pgid, "SIGKILL");

  await waitGone(left, Date.now() + graceMs);
}
