import { readdirSync } from "node:fs";

import { linuxRow } from "./linux-row.ts";
import { PID_ENTRY, POWERSHELL_FLAGS, PS_LOCALE, PS_FORMAT, WIN32_COLUMNS } from "./local.constants.ts";
import { parsePs } from "./parse-ps.ts";
import { parseWin32 } from "./parse-win32.ts";
import type { ProcessRow } from "./process-row.ts";
import { runTool } from "./run-tool.ts";

/**
 * Every live process: from /proc on linux, `ps` on darwin, Win32_Process on win32. One that vanishes mid-read is left
 * out.
 */
export function readProcessTable(platform: NodeJS.Platform = process.platform): ProcessRow[] {
  if (platform === "linux") {
    return readdirSync("/proc")
      .filter((entry) => PID_ENTRY.test(entry))
      .flatMap((entry) => linuxRow(Number(entry)) ?? []);
  }

  if (platform === "win32") {
    return parseWin32(
      runTool("powershell", [...POWERSHELL_FLAGS, `Get-CimInstance Win32_Process | ${WIN32_COLUMNS}`]) ?? "",
    );
  }

  return parsePs(runTool("ps", ["-axo", PS_FORMAT], { LC_ALL: PS_LOCALE }) ?? "");
}
