import { parseArgs } from "node:util";

import type { QueryOptions } from "./query-options.ts";
import { QUERY_DEFAULT_LIMIT, QUERY_DEFAULT_MINUTES } from "./query.constants.ts";

/** The raw options of `infra logs-query`; an unknown flag throws. */
export function parseQueryOptions(argv: readonly string[]): QueryOptions {
  return parseArgs({
    allowPositionals: true,
    args: [...argv],
    options: {
      errors: { type: "boolean" },
      filter: { multiple: true, type: "string" },
      from: { type: "string" },
      "group-by": { type: "string" },
      help: { short: "h", type: "boolean" },
      limit: { default: String(QUERY_DEFAULT_LIMIT), type: "string" },
      minutes: { default: String(QUERY_DEFAULT_MINUTES), type: "string" },
      needle: { type: "string" },
      scope: { default: "prod", type: "string" },
      to: { type: "string" },
      view: { default: "events", type: "string" },
    },
    strict: true,
  });
}
