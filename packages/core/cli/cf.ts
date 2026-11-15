import { appendArgs } from "../src/append-args.ts";
import { cfEnv } from "../src/cf-env.ts";
import { peerProgram } from "../src/peer-program.ts";
import { runInProduct } from "../src/run-in-product.ts";
import { USAGE_EXIT } from "../src/usage-exit.constants.ts";

export function main(args: readonly string[]): Promise<number> {
  if (args.length === 0) {
    process.stderr.write("usage: infra cf [args...]\n");

    return Promise.resolve(USAGE_EXIT);
  }

  return runInProduct({
    childEnv: (env) => cfEnv(env),
    cwd: process.cwd(),
    dir: process.cwd(),
    name: "cf",
    program: (root) => appendArgs(peerProgram(root, "cf", "cf"), args),
  });
}
