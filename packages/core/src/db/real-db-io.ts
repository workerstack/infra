import type { CommandHost } from "../command/command-host.ts";
import { wranglerEnv } from "../wrangler-env.ts";
import type { DbIo } from "./db-io.ts";
import { dbProgram } from "./db-program.ts";
import { runDbChild } from "./run-db-child.ts";

/** The `DbIo` of a real run: programs from the repo root's peer packages, the product's env and the host's stdout. */
export function realDbIo(host: CommandHost): DbIo {
  return {
    env: (product) => wranglerEnv(product.config.env),
    print: host.stdout,
    spawn: (tool, args, child) => runDbChild(dbProgram(host.root(host.cwd), tool, args), child),
  };
}
