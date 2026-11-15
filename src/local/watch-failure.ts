import type { Child } from "./child.ts";

/** A stop that marks itself, so the exits it causes are no failure. */
type Watch = { failed: Promise<Child>; stop: () => Promise<void> };

/**
 * A stop exits every child on purpose; only an exit before it is a failure, which runs `cleanup` and resolves with
 * the child that exited. After a stop, `failed` never resolves.
 */
export function watchFailure(children: readonly Child[], cleanup: () => Promise<void>): Watch {
  let isStopping = false;

  const failed = Promise.race(children.map((child) => child.exited.then(() => child))).then(async (child) => {
    if (isStopping) return new Promise<never>(() => {});

    isStopping = true;
    await cleanup();

    return child;
  });

  return {
    failed,
    stop: async () => {
      isStopping = true;
      await cleanup();
    },
  };
}
