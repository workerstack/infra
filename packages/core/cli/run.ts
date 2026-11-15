import { runInProduct } from "../src/run-in-product.ts";
import { USAGE_EXIT } from "../src/usage-exit.constants.ts";
import { wranglerEnv } from "../src/wrangler-env.ts";

const MIN_ARGS = 2;

export function main(args: readonly string[]): Promise<number> {
  const [dir, file, ...rest] = args;

  if (args.length < MIN_ARGS || dir === undefined || file === undefined) {
    process.stderr.write("usage: infra run <dir> <command> [args...]\n");

    return Promise.resolve(USAGE_EXIT);
  }

  return runInProduct({
    childEnv: (env) => wranglerEnv(env),
    cwd: dir,
    dir,
    name: "run",
    program: () => ({ args: rest, file }),
  });
}
