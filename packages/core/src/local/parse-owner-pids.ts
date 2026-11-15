import { LINE_BREAK, PID_ENTRY } from "./local.constants.ts";

/** The distinct pids of `lsof -t` output or Get-NetTCPConnection's OwningProcess lines, one per line. */
export function parseOwnerPids(text: string): number[] {
  const pids = text
    .split(LINE_BREAK)
    .map((line) => line.trim())
    .filter((line) => PID_ENTRY.test(line))
    .map(Number);

  return [...new Set(pids)];
}
