import { FILTER_OPERATOR_START, FILTER_OPERATORS, NUMERIC_VALUE } from "./query.constants.ts";
import type { TelemetryFilter } from "./telemetry-filter.ts";

/** `key=v`, `key!=v`, `key>=500`, `key~substr`. Numeric values compare as numbers, except for `~`. */
export function parseFilter(raw: string): TelemetryFilter | undefined {
  const at = raw.search(FILTER_OPERATOR_START);

  if (at <= 0) return undefined;

  const rest = raw.slice(at);
  const match = FILTER_OPERATORS.find(([symbol]) => rest.startsWith(symbol));

  if (match === undefined) return undefined;

  const [symbol, operation] = match;
  const text = rest.slice(symbol.length);

  if (text === "") return undefined;

  const numeric = operation !== "includes" && NUMERIC_VALUE.test(text);

  return {
    key: raw.slice(0, at),
    operation,
    type: numeric ? "number" : "string",
    value: numeric ? Number(text) : text,
  };
}
