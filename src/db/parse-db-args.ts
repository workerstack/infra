import { parseArgs } from "node:util";

import { ALL_FLAG } from "../command/all-flag.constants.ts";
import type { DbScope } from "./db-scope.ts";
import { DB_SCOPES } from "./db-scopes.constants.ts";

/** What a database command takes: the flags it allows, and the scope it runs in when none is given. */
export type DbArgSpec = { allowed: readonly string[]; defaultScope?: DbScope };

/** The parsed args: the positionals (`[name|--all]`) and the flags. */
export type DbArgs = { bindings: string[]; dryRun: boolean; force: boolean; positionals: string[]; scope: DbScope };

const OPTIONS = {
  binding: { multiple: true, type: "string" },
  "dry-run": { type: "boolean" },
  force: { type: "boolean" },
  scope: { type: "string" },
} as const;

function scopeOf(value: string | undefined, fallback: DbScope | undefined): DbScope | undefined {
  if (value === undefined) return fallback;

  return DB_SCOPES.find((scope) => scope === value);
}

/** The args as flags and positionals; `undefined` for an unknown or disallowed flag, a bad scope or none required. */
export function parseDbArgs(args: readonly string[], spec: DbArgSpec): DbArgs | undefined {
  try {
    const { positionals, values } = parseArgs({
      allowPositionals: true,
      args: args.filter((arg) => arg !== ALL_FLAG),
      options: OPTIONS,
      strict: true,
    });

    const scope = scopeOf(values.scope, spec.defaultScope);

    if (scope === undefined || !Object.keys(values).every((name) => spec.allowed.includes(name))) return undefined;

    return {
      bindings: values.binding ?? [],
      dryRun: values["dry-run"] === true,
      force: values.force === true,
      positionals: args.includes(ALL_FLAG) ? [ALL_FLAG, ...positionals] : positionals,
      scope,
    };
  } catch {
    return undefined;
  }
}
