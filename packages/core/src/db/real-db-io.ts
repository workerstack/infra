import { appendArgs } from "../append-args.ts";
import type { CommandHost } from "../command/command-host.ts";
import type { PeerProgram } from "../peer-program.ts";
import { peerProgram } from "../peer-program.ts";
import { wranglerEnv } from "../wrangler-env.ts";
import type { DbIo, DbTool } from "./db-io.ts";
import { runDbChild } from "./run-db-child.ts";

// The peer package installed for `root` that provides `tool`.
function dbProgram(root: string, tool: DbTool, args: string[]): PeerProgram {
  return appendArgs(peerProgram(root, tool === "database" ? "@workerstack/database" : tool, tool), args);
}

/** The `DbIo` of a real run: programs from the repo root's peer packages, the product's env and the host's stdout. */
export function realDbIo(host: CommandHost): DbIo {
  return {
    env: (product) => wranglerEnv(product.config.env),
    print: host.stdout,
    spawn: (tool, args, child) => runDbChild(dbProgram(host.root(host.cwd), tool, args), child),
  };
}
