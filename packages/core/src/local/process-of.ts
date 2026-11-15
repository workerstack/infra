import { linuxRow } from "./linux-row.ts";
import { POWERSHELL_FLAGS, PS_LOCALE, PS_FORMAT, WIN32_COLUMNS } from "./local.constants.ts";
import { parsePs } from "./parse-ps.ts";
import { parseWin32 } from "./parse-win32.ts";
import type { ProcessRow } from "./process-row.ts";
import { runTool } from "./run-tool.ts";

/** One process, reading only it; `undefined` once it is gone or cannot be read. */
export function processOf(pid: number, platform: NodeJS.Platform = process.platform): ProcessRow | undefined {
  if (platform === "linux") return linuxRow(pid);

  if (platform === "win32") {
    const filter = `Get-CimInstance Win32_Process -Filter "ProcessId=${pid}" | ${WIN32_COLUMNS}`;

    return parseWin32(runTool("powershell", [...POWERSHELL_FLAGS, filter]) ?? "")[0];
  }

  return parsePs(runTool("ps", ["-o", PS_FORMAT, "-p", String(pid)], { LC_ALL: PS_LOCALE }) ?? "")[0];
}
