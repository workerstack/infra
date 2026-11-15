/** The views the telemetry query offers. */
export const QUERY_VIEWS = ["events", "invocations", "traces", "calculations"] as const;

/** What a calculations view groups by when `--group-by` is not given. */
export const DEFAULT_GROUP_BY = "$workers.outcome";

/** Minutes of logs a query reads when `--minutes` is not given. */
export const QUERY_DEFAULT_MINUTES = 60;

/** Rows a query reads when `--limit` is not given. */
export const QUERY_DEFAULT_LIMIT = 50;

/** A filter value that compares as a number. */
export const NUMERIC_VALUE: RegExp = /^-?\d+(\.\d+)?$/;

/** The first character of a filter's operator. */
export const FILTER_OPERATOR_START: RegExp = /[=!<>~]/;

/** Filter operators, longest first, and the telemetry operation each means. */
export const FILTER_OPERATORS = [
  [">=", "gte"],
  ["<=", "lte"],
  ["!=", "neq"],
  [">", "gt"],
  ["<", "lt"],
  ["~", "includes"],
  ["=", "eq"],
] as const;

/** What `infra logs-query --help` and a bad argument print. */
export const QUERY_USAGE: readonly string[] = [
  "usage: infra logs-query <worker>... [--scope prod|dev] [--view events|invocations|traces|calculations]",
  "       [--minutes 60 | --from <iso> [--to <iso>]] [--errors] [--needle text] [--filter key<op>value]...",
  "       [--group-by key] [--limit 50]",
  "events: log lines. invocations: grouped by request. traces: span trees (observability.traces.enabled).",
  "calculations: count + median/p99 wallTimeMs grouped by --group-by (default $workers.outcome).",
  "Full response goes to .tmp/infra/query/<stamp>-<script>-<view>.json; summary on stdout.",
];
