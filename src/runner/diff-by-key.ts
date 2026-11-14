import type { DriftSplit } from "./drift-split.ts";

/** Splits declared and live items by `keyOf`: declared-only are `missing`, live-only are `extra`. */
export function diffByKey<T>(declared: T[], live: T[], keyOf: (item: T) => string): DriftSplit<T> {
  const declaredKeys = new Set(declared.map(keyOf));
  const liveKeys = new Set(live.map(keyOf));

  return {
    declared: declared.length,
    extra: live.filter((item) => !declaredKeys.has(keyOf(item))),
    live: live.length,
    missing: declared.filter((item) => !liveKeys.has(keyOf(item))),
  };
}
