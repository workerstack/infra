import type { QueryView } from "./query-view.ts";
import type { TelemetryResult } from "./telemetry-result.ts";

/** Sampled reads drop rare events; calculations stay exact enough to locate them. */
export function samplingWarning(view: QueryView, result: TelemetryResult): string | undefined {
  const level = result.statistics?.abr_level ?? 1;

  if (level <= 1 || view === "calculations") return undefined;

  return (
    `! sampled (abr_level ${level}): rare events may be missing. ` +
    "Locate them with --view calculations, then narrow with --from/--to."
  );
}
