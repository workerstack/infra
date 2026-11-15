import * as z from "zod";

import { CIM_DATE_MS } from "./local.constants.ts";
import type { ProcessRow } from "./process-row.ts";
import { readOrUndefined } from "./read-or-undefined.ts";

// One process comes back as an object, several as an array; a date is a string or `{ value }`.
function cimRows(): z.ZodType<
  {
    CommandLine?: string | null | undefined;
    CreationDate?: string | null | undefined;
    ParentProcessId: number;
    ProcessId: number;
  }[]
> {
  const date = z.union([z.string(), z.object({ value: z.string() }).transform((wrapped) => wrapped.value)]).nullish();

  const row = z.object({
    CommandLine: z.string().nullish(),
    CreationDate: date,
    ParentProcessId: z.number(),
    ProcessId: z.number(),
  });

  return z.union([z.array(row), row.transform((one) => [one])]);
}

function startOf(date: string | null | undefined): number {
  const text = date ?? "";
  const ms = CIM_DATE_MS.exec(text)?.[1];
  const start = ms === undefined ? Date.parse(text) : Number(ms);

  return Number.isNaN(start) ? 0 : start;
}

/**
 * The rows of `Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CreationDate,CommandLine |
 * ConvertTo-Json`. Windows PowerShell 5.1 writes CreationDate as `/Date(<epoch ms>)/`, PowerShell 7 as ISO 8601.
 * There are no process groups, so each process leads its own.
 */
export function parseWin32(text: string): ProcessRow[] {
  const parsed = readOrUndefined(() => cimRows().parse(JSON.parse(text)));

  return (parsed ?? []).map((row) => ({
    cmdline: row.CommandLine ?? "",
    group: row.ProcessId,
    parent: row.ParentProcessId,
    pid: row.ProcessId,
    start: startOf(row.CreationDate),
  }));
}
