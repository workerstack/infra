import type { ProductTarget } from "../products.ts";
import { ALL_FLAG } from "./all-flag.constants.ts";

/** `[name|--all]` as a target, or `undefined` for extra args or an unknown flag; no args is no target. */
export function parseTarget(args: readonly string[]): { target: ProductTarget } | undefined {
  const [first, ...rest] = args;

  if (rest.length > 0) return undefined;

  if (first === undefined) return { target: undefined };

  if (first === ALL_FLAG) return { target: { all: true } };

  if (first.startsWith("-")) return undefined;

  return { target: { name: first } };
}
