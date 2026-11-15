/** One `bun repo env set` run: the binary, its args, the repo root it runs in and the value for stdin. */
export type EnvSetCall = { args: string[]; command: string; cwd: string; stdin: string };
