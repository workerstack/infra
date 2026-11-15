import type { Log } from "../shared/log.ts";

/** Runs one zone step between its progress lines: `  <label> ...` then `    → done`. */
export async function applyZoneStep(log: Log, label: string, run: () => Promise<void>): Promise<void> {
  log(`  ${label} ...`);
  await run();
  log("    → done");
}
