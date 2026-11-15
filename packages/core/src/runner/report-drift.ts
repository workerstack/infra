import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { DriftSplit } from "./drift-split.ts";

/** How a drift section reads: its label and how one item is shown. */
export type DriftSection<T> = { format: (item: T) => string; label: string };

/** Prints declared and live counts, then the items missing on the zone (`-`) and extra on it (`+`). */
export function reportDrift<T>(split: DriftSplit<T>, section: DriftSection<T>, log: Log = stdoutLog): void {
  log(`  ${section.label}: declared=${split.declared} live=${split.live}`);

  if (split.missing.length > 0) {
    log(`    ⚠ missing on zone (${split.missing.length}):`);

    for (const item of split.missing) log(`      - ${section.format(item)}`);
  }

  if (split.extra.length > 0) {
    log(`    ⚠ extra on zone (${split.extra.length}):`);

    for (const item of split.extra) log(`      + ${section.format(item)}`);
  }

  if (split.missing.length === 0 && split.extra.length === 0) log("    → in sync");
}
