import { readFileSync } from "node:fs";

import { STAT_FIELDS_OFFSET, STAT_PGRP_AT, STAT_PPID_AT, STAT_START_AT, TRAILING_NUL } from "./local.constants.ts";
import type { ProcessRow } from "./process-row.ts";
import { readOrUndefined } from "./read-or-undefined.ts";

/** A process from /proc, past the command in its stat, which may hold spaces and parens; `undefined` once gone. */
export function linuxRow(pid: number): ProcessRow | undefined {
  const stat = readOrUndefined(() => readFileSync(`/proc/${pid}/stat`, "utf8"));
  const cmdline = readOrUndefined(() => readFileSync(`/proc/${pid}/cmdline`, "utf8"));

  if (stat === undefined || cmdline === undefined) return undefined;

  const fields = stat.slice(stat.lastIndexOf(")") + STAT_FIELDS_OFFSET).split(" ");

  return {
    cmdline: cmdline.replace(TRAILING_NUL, "").split("\0").join(" "),
    group: Number(fields[STAT_PGRP_AT]),
    parent: Number(fields[STAT_PPID_AT]),
    pid,
    start: Number(fields[STAT_START_AT]),
  };
}
