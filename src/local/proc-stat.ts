import { readFileSync } from "node:fs";

import { STAT_FIELDS_OFFSET, STAT_PGRP_AT, STAT_START_AT } from "./local.constants.ts";
import { readOrUndefined } from "./read-or-undefined.ts";

/** A process's group and start time from /proc/<pid>/stat, past the command, which may hold spaces and parens. */
export function procStat(pid: number): { pgrp: number; start: number } | undefined {
  const stat = readOrUndefined(() => readFileSync(`/proc/${pid}/stat`, "utf8"));

  if (stat === undefined) return undefined;

  const fields = stat.slice(stat.lastIndexOf(")") + STAT_FIELDS_OFFSET).split(" ");

  return { pgrp: Number(fields[STAT_PGRP_AT]), start: Number(fields[STAT_START_AT]) };
}
