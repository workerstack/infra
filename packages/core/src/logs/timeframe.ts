import { MS_PER_MINUTE } from "./logs.constants.ts";
import type { QueryArgs } from "./query-args.ts";
import type { QueryTimeframe } from "./query-timeframe.ts";

/** `--from` and `--to` when given, else the last `--minutes` up to `now`. */
export function timeframe(args: QueryArgs, now: number): QueryTimeframe {
  const to = args.to ?? now;

  return { from: args.from ?? to - args.minutes * MS_PER_MINUTE, to };
}
