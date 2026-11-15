import { parseFilter } from "./parse-filter.ts";
import type { ParsedFilters } from "./parsed-filters.ts";
import type { TelemetryFilter } from "./telemetry-filter.ts";

function badFilter(raw: string): ParsedFilters {
  return { error: `--filter must be key<op>value with op = != > >= < <= ~, got "${raw}".`, ok: false };
}

/** Reads every `--filter` value; the first one that is not `key<op>value` fails the lot. */
export function parseFilters(raws: readonly string[]): ParsedFilters {
  const filters: TelemetryFilter[] = [];

  for (const raw of raws) {
    const filter = parseFilter(raw);

    if (filter === undefined) return badFilter(raw);

    filters.push(filter);
  }

  return { filters, ok: true };
}
