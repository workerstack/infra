import type { QueryTimeframe } from "./query-timeframe.ts";
import type { QueryView } from "./query-view.ts";
import type { TelemetryFilter } from "./telemetry-filter.ts";

/** What the telemetry query filters and counts. */
export type QueryParameters = {
  calculations?: { key?: string; keyType?: string; operator: string }[];
  datasets: string[];
  filters: TelemetryFilter[];
  groupBys?: { type: string; value: string }[];
  needle?: { value: string };
};

/** The telemetry query's request body. */
export type QueryBody = {
  limit: number;
  parameters: QueryParameters;
  queryId: string;
  timeframe: QueryTimeframe;
  view: QueryView;
};
