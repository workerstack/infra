import { tmpdir } from "node:os";
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

/**
 * The pids in a group that run a script of ours: win32 also counts the console host a detached child gets, which
 * stops with its tree.
 */
export function scriptPids(pgid: number): number[] {
  return membersOf(readProcessTable(), pgid)
    .filter((row) => row.cmdline.includes(SCRIPT_FLAG))
    .map((row) => row.pid);
}

/** Resolves once `check` holds, or once `ms` passed: a check can be slow, as a PowerShell call is on win32. */
export async function until(check: () => boolean, ms = 5000, deadline = Date.now() + ms): Promise<void> {
  if (check() || Date.now() >= deadline) return;

  await sleep(50);
  await until(check, ms, deadline);
}

/** A script that stays alive until it is stopped. */
export const SLEEP = "setTimeout(() => {}, 1e9)";

// The flag every script child runs with, which marks it in a command line.
const SCRIPT_FLAG = " -e ";

// A script that starts a child running `script`; `options` is the spawn options' source.
function spawnOf(script: string, options = '{ stdio: "ignore" }'): string {
  return `require("node:child_process").spawn(process.execPath, ["-e", ${JSON.stringify(script)}], ${options})`;
}

/** A script that starts a child running `script`, then stays alive: `script`'s tree plus one. */
export function parentOf(script: string): string {
  return `${spawnOf(script)}; ${SLEEP}`;
}

/**
 * A script that starts a child running `script`, then exits at once: the child outlives its leader. On win32 Node puts
 * a child it does not detach in a job that dies with it, so there the child is detached; posix keeps it in the group.
 */
export function abandoning(script: string): string {
  return `${spawnOf(script, '{ detached: process.platform === "win32", stdio: "ignore" }')}; process.exit(0)`;
}

// One argument as Windows writes it into a command line: quoted when it holds a space or a quote.
function winQuoted(arg: string): string {
  return /[\s"]/.test(arg) ? `"${arg.replaceAll('"', String.raw`\"`)}"` : arg;
}

/** The command line the system reports for `process.execPath -e script`: joined by spaces, quoted on win32. */
export function reportedLine(script: string): string {
  const argv = [process.execPath, "-e", script];

  return (process.platform === "win32" ? argv.map((arg) => winQuoted(arg)) : argv).join(" ");
}

/** `node -e script` as a quiet group child; `stopStarted` stops every one started. */
export function nodeGroups() {
  const started: Child[] = [];

  return {
    start: async (name: string, script: string) => {
      const cmd = [process.execPath, "-e", script];
      const child = await spawnGroup({ cmd, cwd: tmpdir(), env: process.env, name, onLine: () => {} });

      started.push(child);

      return child;
    },
    stopStarted: () => stopGroups(started.splice(0)),
  };
}
