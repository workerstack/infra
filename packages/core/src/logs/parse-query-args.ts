import { parseDeployScope } from "../workers/parse-deploy-scope.ts";
import { parseFilters } from "./parse-filters.ts";
import { parseQueryOptions } from "./parse-query-options.ts";
import { parseQueryWindow } from "./parse-query-window.ts";
import type { ParseResult } from "./parse-result.ts";
import type { QueryArgs } from "./query-args.ts";
import type { QueryOptions } from "./query-options.ts";
import { DEFAULT_GROUP_BY, QUERY_VIEWS } from "./query.constants.ts";

function invalid(values: QueryOptions["values"]): string | undefined {
  if (!(Number(values.minutes) > 0)) return `--minutes must be > 0, got "${values.minutes}".`;

  return Number(values.limit) > 0 ? undefined : `--limit must be > 0, got "${values.limit}".`;
}

function build(parsed: QueryOptions, scope: QueryArgs["scope"]): ParseResult<QueryArgs> {
  const { positionals, values } = parsed;
  const view = QUERY_VIEWS.find((candidate) => candidate === values.view);

  if (view === undefined) return { kind: "error", message: `--view must be one of ${QUERY_VIEWS.join(", ")}.` };

  const problem = invalid(values);

  if (problem !== undefined) return { kind: "error", message: problem };

  const window = parseQueryWindow(values.from, values.to);
  const filters = parseFilters(values.filter ?? []);

  if (!window.ok) return { kind: "error", message: window.error };

  if (!filters.ok) return { kind: "error", message: filters.error };

  const args: QueryArgs = {
    errors: values.errors ?? false,
    filters: filters.filters,
    from: window.from,
    groupBy: values["group-by"] ?? DEFAULT_GROUP_BY,
    limit: Number(values.limit),
    minutes: Number(values.minutes),
    needle: values.needle,
    scope,
    selectors: positionals,
    to: window.to,
    view,
  };

  return { args, kind: "run" };
}

/** Reads `infra logs-query`'s arguments: Workers, `--scope` (default prod), the view, the window and the filters. */
export function parseQueryArgs(argv: readonly string[]): ParseResult<QueryArgs> {
  let parsed: QueryOptions;

  try {
    parsed = parseQueryOptions(argv);
  } catch (error) {
    return { kind: "error", message: error instanceof Error ? error.message : String(error) };
  }

  if (parsed.values.help === true) return { kind: "help" };

  if (parsed.positionals.length === 0) return { kind: "error", message: "Pass at least one worker selector." };

  const scope = parseDeployScope(parsed.values.scope);

  if (scope === undefined)
    return { kind: "error", message: `--scope must be dev or prod, got "${parsed.values.scope}".` };

  return build(parsed, scope);
}
