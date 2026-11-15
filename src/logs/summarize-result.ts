import { eventLine } from "./event-line.ts";
import type { QueryView } from "./query-view.ts";
import { summarizeInvocations } from "./summarize-invocations.ts";
import { summarizeTraces } from "./summarize-traces.ts";
import type { TelemetryResult } from "./telemetry-result.ts";

/** Compact, greppable lines per view; the dump keeps everything. */
export function summarizeResult(view: QueryView, result: TelemetryResult): string[] {
  if (view === "events") return (result.events?.events ?? []).map(eventLine);

  if (view === "invocations") return summarizeInvocations(result.invocations ?? {});

  if (view === "traces") return summarizeTraces(result.traces ?? []);

  return (result.calculations ?? []).flatMap((calc) =>
    (calc.aggregates ?? []).map((a) => `${calc.calculation} ${a.groupKey ?? "*"} = ${a.value} (n=${a.count})`),
  );
}
