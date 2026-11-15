import { setTimeout as sleep } from "node:timers/promises";

import type { Child } from "./child.ts";
import { ERRNO_NO_PROCESS, STOP_GRACE_MS, STOP_POLL_MS, WIN32 } from "./local.constants.ts";
import { membersOf } from "./members-of.ts";
import type { ProcessRow } from "./process-row.ts";
import { readProcessTable } from "./read-process-table.ts";
import { runTool } from "./run-tool.ts";

// Whether any process is left in the group; another user's live group counts. win32 has no groups: the process
// and its descendants stand for one.
function groupAlive(pgid: number, rows: readonly ProcessRow[]): boolean {
  if (process.platform === WIN32) return membersOf(rows, pgid).length > 0;

  try {
    process.kill(-pgid, 0);

    return true;
  } catch (error) {
    return !(error instanceof Error && "code" in error && error.code === ERRNO_NO_PROCESS);
  }
}

// SIGTERM, or SIGKILL when `force`. win32 has no signal a windowless process can catch: `taskkill /T` without `/F`
// only asks a window to close, so every stop there is `/F` at once.
function signalGroup(pgid: number, { force }: { force: boolean }): void {
  if (process.platform === WIN32) {
    // A live leader's tree is every member; a dead leader's members each are the root of their own.
    const roots = membersOf(readProcessTable(), pgid).filter((row) => row.pid === pgid || row.parent === pgid);

    for (const root of roots.length === 0 ? [pgid] : roots.map((row) => row.pid))
      runTool("taskkill", ["/PID", String(root), "/T", "/F"]);

    return;
  }

  try {
    process.kill(-pgid, force ? "SIGKILL" : "SIGTERM");
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === ERRNO_NO_PROCESS)) throw error;
  }
}

async function waitGone(pgids: readonly number[], deadline: number): Promise<number[]> {
  // One table per poll on win32, where it is a PowerShell call; posix asks the kernel per group.
  const rows = process.platform === WIN32 ? readProcessTable() : [];
  const left = pgids.filter((pgid) => groupAlive(pgid, rows));

  if (left.length === 0 || Date.now() >= deadline) return left;

  await sleep(STOP_POLL_MS);

  return waitGone(left, deadline);
}

/** SIGTERM each group, then SIGKILL what is left after the grace period; win32 ends each tree with `taskkill /T /F`. */
export async function stopGroups(
  children: readonly Pick<Child, "pgid">[],
  graceMs: number = STOP_GRACE_MS,
): Promise<void> {
  const pgids = children.map((child) => child.pgid);

  for (const pgid of pgids) signalGroup(pgid, { force: false });

  const left = await waitGone(pgids, Date.now() + graceMs);

  for (const pgid of left) signalGroup(pgid, { force: true });

  await waitGone(left, Date.now() + graceMs);
}
