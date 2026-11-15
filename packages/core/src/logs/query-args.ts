import type { DeployScope } from "../workers/deploy-scope.ts";
import type { QueryView } from "./query-view.ts";
import type { TelemetryFilter } from "./telemetry-filter.ts";

/** What `infra logs-query` was asked. */
export type QueryArgs = {
  errors: boolean;
  filters: TelemetryFilter[];
  /** Absolute window start (ms). Overrides `minutes`. */
  from?: number | undefined;
  groupBy: string;
  limit: number;
  minutes: number;
  needle?: string | undefined;
  scope: DeployScope;
  selectors: string[];
  /** Absolute window end (ms). Defaults to now. */
  to?: number | undefined;
  view: QueryView;
};
