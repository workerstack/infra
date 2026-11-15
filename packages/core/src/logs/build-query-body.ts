import type { QueryArgs } from "./query-args.ts";
import type { QueryBody, QueryParameters } from "./query-body.ts";
import type { TelemetryFilter } from "./telemetry-filter.ts";
import { timeframe } from "./timeframe.ts";

const WALL = { key: "$workers.wallTimeMs", keyType: "number" };

function stringFilter(key: string, value: string): TelemetryFilter {
  return { key, operation: "eq", type: "string", value };
}

function parametersOf(args: QueryArgs, scriptName: string): QueryParameters {
  const filters = [stringFilter("$metadata.service", scriptName)];

  if (args.errors) filters.push(stringFilter("$metadata.level", "error"));

  filters.push(...args.filters);

  return {
    datasets: ["cloudflare-workers"],
    filters,
    ...(args.needle !== undefined && args.needle !== "" && { needle: { value: args.needle } }),
    ...(args.view === "calculations" && {
      calculations: [{ operator: "count" }, { ...WALL, operator: "median" }, { ...WALL, operator: "p99" }],
      groupBys: [{ type: "string", value: args.groupBy }],
    }),
  };
}

/** The telemetry query body for one deployed script. Exceptions log at `error`, so `--errors` is one filter. */
export function buildQueryBody(args: QueryArgs, scriptName: string, now: number): QueryBody {
  return {
    limit: args.limit,
    parameters: parametersOf(args, scriptName),
    queryId: "infra-logs-query",
    timeframe: timeframe(args, now),
    view: args.view,
  };
}
