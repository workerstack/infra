import { parseDeployScope } from "../workers/parse-deploy-scope.ts";
import type { ParseResult } from "./parse-result.ts";
import { parseTailOptions } from "./parse-tail-options.ts";
import type { TailArgs } from "./tail-args.ts";
import type { TailOptions } from "./tail-options.ts";
import { TAIL_PASS_THROUGH } from "./tail.constants.ts";

function passThroughOf(values: TailOptions["values"]): string[] {
  return TAIL_PASS_THROUGH.flatMap((flag) => (values[flag] ?? []).flatMap((value) => [`--${flag}`, value]));
}

/** Reads `infra logs-tail`'s arguments: Workers, `--scope` (default prod), `--minutes` and the wrangler filters. */
export function parseTailArgs(argv: readonly string[]): ParseResult<TailArgs> {
  let parsed: TailOptions;

  try {
    parsed = parseTailOptions(argv);
  } catch (error) {
    return { kind: "error", message: error instanceof Error ? error.message : String(error) };
  }

  const { positionals, values } = parsed;

  if (values.help === true) return { kind: "help" };

  if (positionals.length === 0) return { kind: "error", message: "Pass at least one worker selector." };

  const scope = parseDeployScope(values.scope);

  if (scope === undefined) return { kind: "error", message: `--scope must be dev or prod, got "${values.scope}".` };

  const minutes = Number(values.minutes);

  if (!Number.isFinite(minutes) || minutes < 0)
    return { kind: "error", message: `--minutes must be >= 0, got "${values.minutes}".` };

  return { args: { minutes, passThrough: passThroughOf(values), scope, selectors: positionals }, kind: "run" };
}
