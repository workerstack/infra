import { parseArgs } from "node:util";

import type { StackChoice } from "./stack-candidate.ts";

/** `infra loc`'s args: at most one product name, and the stack choice. */
export type LocArgs = { choice: StackChoice; positionals: string[] };

const OPTIONS = { only: { multiple: true, type: "string" }, with: { multiple: true, type: "string" } } as const;

// Each flag may repeat and may hold a comma-separated list.
function dirsOf(values: readonly string[] | undefined): string[] | undefined {
  return values?.flatMap((value) => value.split(",")).filter((dir) => dir !== "");
}

/** `[name] [--only dir,...] [--with dir,...]`, or `undefined` for an unknown flag (`--all` too) or a second name. */
export function parseLocArgs(args: readonly string[]): LocArgs | undefined {
  try {
    const { positionals, values } = parseArgs({
      allowPositionals: true,
      args: [...args],
      options: OPTIONS,
      strict: true,
    });

    if (positionals.length > 1) return undefined;

    return { choice: { only: dirsOf(values.only), with: dirsOf(values.with) }, positionals };
  } catch {
    return undefined;
  }
}
