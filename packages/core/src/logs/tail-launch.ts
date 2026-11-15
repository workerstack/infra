import type { ChildEnv } from "../child-env.ts";

/** What to run for one tail: the program, its args, the dir and the env it runs with. */
export type TailLaunch = { args: string[]; cwd: string; env: ChildEnv; file: string };
