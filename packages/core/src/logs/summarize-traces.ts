import { clip } from "./clip.ts";
import { ISO_MILLIS_END, ISO_MONTH_START } from "./logs.constants.ts";
import type { TraceSummary } from "./telemetry-result.ts";

/** One line per trace, then its errors indented. */
export function summarizeTraces(traces: TraceSummary[]): string[] {
  return traces.flatMap((trace) => {
    const time = new Date(trace.traceStartMs ?? 0).toISOString().slice(ISO_MONTH_START, ISO_MILLIS_END);
    const errors = trace.errors ?? [];
    const services = (trace.services ?? []).join(", ");
    const head = `${time} ${trace.traceId ?? "?"} ${trace.traceDurationMs ?? "?"}ms spans=${trace.spans ?? "?"}`;

    return [
      `${head} errors=${errors.length} [${services}] ${clip(trace.rootTransactionName ?? "")}`,
      ...errors.map((error) => `  ! ${clip(error instanceof Object ? JSON.stringify(error) : String(error))}`),
    ];
  });
}
