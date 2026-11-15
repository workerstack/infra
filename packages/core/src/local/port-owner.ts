import { portPids } from "./port-pids.ts";
import { processOf } from "./process-of.ts";

/** `pid N: command` of the process listening on `port`, or `undefined` when none can be found. */
export function portOwner(port: number): string | undefined {
  const pid = portPids(port)[0];

  return pid === undefined ? undefined : `pid ${pid}: ${processOf(pid)?.cmdline ?? ""}`;
}
