import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { REPORT_KEY_WIDTH } from "./report-key-width.constants.ts";

/** Prints the live scalar zone settings, one aligned line each. */
export function reportSettings(settings: Record<string, string>, log: Log = stdoutLog): void {
  log("  Settings:");

  for (const [key, value] of Object.entries(settings)) log(`    ${key.padEnd(REPORT_KEY_WIDTH)} ${value}`);
}
