import { linuxPortPids } from "./linux-port-pids.ts";
import { POWERSHELL_FLAGS } from "./local.constants.ts";
import { parseOwnerPids } from "./parse-owner-pids.ts";
import { runTool } from "./run-tool.ts";

/** The pids listening on a TCP port: /proc on linux, `lsof` on darwin, Get-NetTCPConnection on win32. */
export function portPids(port: number, platform: NodeJS.Platform = process.platform): number[] {
  if (platform === "linux") return linuxPortPids(port);

  if (platform === "win32") {
    const listen = [
      `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue`,
      "Select-Object -ExpandProperty OwningProcess",
    ].join(" | ");

    return parseOwnerPids(runTool("powershell", [...POWERSHELL_FLAGS, listen]) ?? "");
  }

  return parseOwnerPids(runTool("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"]) ?? "");
}
