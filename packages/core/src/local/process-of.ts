import { linuxRow } from "./linux-row.ts";
import { LINUX, POWERSHELL_FLAGS, PS_LOCALE, PS_FORMAT, WIN32, WIN32_COLUMNS } from "./local.constants.ts";
import { parsePs } from "./parse-ps.ts";
import { parseWin32 } from "./parse-win32.ts";
import type { ProcessRow } from "./process-row.ts";
import { runTool } from "./run-tool.ts";

/** One process, reading only it; `undefined` once it is gone or cannot be read; `run` runs the listing tool. */
export function processOf(
  pid: number,
  platform: NodeJS.Platform = process.platform,
  run: typeof runTool = runTool,
): ProcessRow | undefined {
  if (platform === LINUX) return linuxRow(pid);

  if (platform === WIN32) {
    const filter = `Get-CimInstance Win32_Process -Filter "ProcessId=${pid}" | ${WIN32_COLUMNS}`;

    return parseWin32(run("powershell", [...POWERSHELL_FLAGS, filter]) ?? "")[0];
  }

  return parsePs(run("ps", ["-ww", "-o", PS_FORMAT, "-p", String(pid)], { LC_ALL: PS_LOCALE }) ?? "")[0];
}
