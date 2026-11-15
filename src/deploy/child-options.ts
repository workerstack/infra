import type { ChildEnv } from "../child-env.ts";

/** Where a program runs and with what env. */
export type ChildOptions = { cwd: string; env: ChildEnv };
