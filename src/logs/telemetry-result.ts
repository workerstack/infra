import type { TelemetryEvent } from "./telemetry-event.ts";

/** One trace in the traces view. */
export type TraceSummary = {
  errors?: unknown[];
  rootTransactionName?: string;
  services?: string[];
  spans?: number;
  traceDurationMs?: number;
  traceId?: string;
  traceStartMs?: number;
};

/** The telemetry query's result: the view that was asked for is filled. */
export type TelemetryResult = {
  calculations?: { aggregates?: { count?: number; groupKey?: string; value?: number }[]; calculation?: string }[];
  events?: { events?: TelemetryEvent[] };
  invocations?: Record<string, TelemetryEvent[]>;
  /** `abr_level` above 1 is adaptive sampling: rows were skipped to bound the read. */
  statistics?: { abr_level?: number };
  traces?: TraceSummary[];
};
