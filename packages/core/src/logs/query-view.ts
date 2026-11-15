import type { QUERY_VIEWS } from "./query.constants.ts";

/** One of the telemetry query's views. */
export type QueryView = (typeof QUERY_VIEWS)[number];
