import { WIN32 } from "./local.constants.ts";
import type { ProcessRow } from "./process-row.ts";

// Children by parent links, each started no earlier than its parent: a pid reused later cannot close a cycle.
function descend(rows: readonly ProcessRow[], frontier: readonly ProcessRow[], seen: ProcessRow[]): ProcessRow[] {
  const next = new Set(
    frontier.flatMap((parent) =>
      rows.filter((row) => row.parent === parent.pid && row.start >= parent.start && !seen.includes(row)),
    ),
  );

  if (next.size === 0) return seen;

  return descend(rows, [...next], [...seen, ...next]);
}

/**
 * The live members of a leader's group. Posix: the rows in that process group. win32 has no groups: the leader's row,
 * if it is alive, and every descendant through parent links; with the leader dead, its children and theirs.
 */
export function membersOf(
  rows: readonly ProcessRow[],
  leader: number,
  platform: NodeJS.Platform = process.platform,
): ProcessRow[] {
  if (platform !== WIN32) return rows.filter((row) => row.group === leader);

  const root = rows.find((row) => row.pid === leader);

  if (root !== undefined) return descend(rows, [root], [root]);

  // A dead leader: what it left is its children and theirs, by the parent link alone.
  const children = rows.filter((row) => row.parent === leader && row.pid !== leader);

  return descend(rows, children, children);
}
