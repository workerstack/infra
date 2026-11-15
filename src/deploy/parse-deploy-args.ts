import { parseDeployScope } from "../workers/parse-deploy-scope.ts";
import type { DeployArgs } from "./deploy-args.ts";
import { FLAG_PRUNE, FLAG_SCOPE } from "./deploy-flags.constants.ts";

/**
 * Parses `[worker...] --scope dev|prod [--prune]`; `undefined` for a missing or unknown scope, an unknown flag or a
 * flag with no value.
 */
export function parseDeployArgs(args: readonly string[]): DeployArgs | undefined {
  const selectors: string[] = [];
  let isPrune = false;
  let value: string | undefined;

  for (let at = 0; at < args.length; at += 1) {
    const arg = args[at] ?? "";

    if (arg === FLAG_PRUNE) {
      isPrune = true;
    } else if (arg === FLAG_SCOPE) {
      at += 1;
      value = args[at];
    } else if (arg.startsWith("-")) {
      return undefined;
    } else {
      selectors.push(arg);
    }
  }

  const scope = parseDeployScope(value);

  return scope === undefined ? undefined : { prune: isPrune, scope, selectors };
}
