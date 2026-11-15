import type { TelemetryFilter } from "./telemetry-filter.ts";

/** Every `--filter` as a filter, or the line for the first one that is not `key<op>value`. */
export type ParsedFilters = { error: string; ok: false } | { filters: TelemetryFilter[]; ok: true };
