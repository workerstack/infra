import type { TailChild } from "./tail-child.ts";

/** A stop for a set of tails: `stop` kills every child; `wasStopped` tells whether it was called. */
export type TailStop = { stop: () => void; wasStopped: () => boolean };

/** The stop for `children`; a child that ends on a stop is not a failure. */
export function tailStop(children: TailChild[]): TailStop {
  let isStopped = false;

  return {
    stop: () => {
      isStopped = true;

      for (const child of children) child.kill();
    },
    wasStopped: () => isStopped,
  };
}
