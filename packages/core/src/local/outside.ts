/**
 * Why a routed Worker has no member: every dir that deploys it runs under Vite and is not in `local.apps`, is a
 * container Worker not joined with `--with`, or was left out by `--only`.
 */
export type OutsideWhy = "not-chosen" | "opt-in" | "vite";

/** A routed Worker the stack does not run: every package dir that deploys it, and why. */
export type Outside = { dirs: string[]; why: OutsideWhy };
