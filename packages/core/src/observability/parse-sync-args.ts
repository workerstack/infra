import { parseArgs } from "node:util";

import { parseDeployScope } from "../workers/parse-deploy-scope.ts";
import type { SyncArgs } from "./sync-args.ts";
import { SYNC_DEFAULT_SCOPE, SYNC_USAGE } from "./sync-usage.constants.ts";

function read(args: readonly string[]): ReturnType<typeof parseArgs> {
  return parseArgs({
    allowPositionals: true,
    args: [...args],
    options: { apply: { type: "boolean" }, scope: { default: SYNC_DEFAULT_SCOPE, type: "string" } },
    strict: true,
  });
}

function badScope(value: string): SyncArgs {
  return {
    message: `infra observability-sync: --scope must be dev or prod, got "${value}"\n${SYNC_USAGE}`,
    ok: false,
  };
}

/** `<worker>... [--scope prod|dev] [--apply]`: the scope defaults to prod; anything else is a usage error. */
export function parseSyncArgs(args: readonly string[]): SyncArgs {
  let parsed: ReturnType<typeof read>;

  try {
    parsed = read(args);
  } catch {
    return { message: SYNC_USAGE, ok: false };
  }

  const value = String(parsed.values["scope"]);
  const scope = parseDeployScope(value);

  if (parsed.positionals.length === 0) return { message: SYNC_USAGE, ok: false };

  if (scope === undefined) return badScope(value);

  return { apply: parsed.values["apply"] === true, ok: true, scope, selectors: parsed.positionals };
}
