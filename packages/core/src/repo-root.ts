import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { GIT_ENTRY } from "./git-entry.constants.ts";

/** Walks up from `from` to the first directory holding a `.git` entry (a directory, or a file in a worktree). */
export function repoRoot(from: string): string {
  const start = resolve(from);

  for (let dir = start; ; dir = dirname(dir)) {
    if (existsSync(join(dir, GIT_ENTRY))) return dir;

    if (dirname(dir) === dir) throw new Error(`no git repository above ${from}`);
  }
}
