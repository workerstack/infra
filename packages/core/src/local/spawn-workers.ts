import { join } from "node:path";

import { appendArgs } from "../append-args.ts";
import { peerProgram } from "../peer-program.ts";
import { freePort } from "./free-port.ts";
import { LOOPBACK, STATE_DIR } from "./local.constants.ts";
import type { SpawnContext } from "./spawn-context.ts";
import { spawnGroup } from "./spawn-group.ts";
import type { StackMember } from "./stack-candidate.ts";
import type { StackProcess } from "./stack-options.ts";
import { writeDispatcher } from "./write-dispatcher.ts";

// The `wrangler dev` args: the dispatcher's config first, then each Worker's, on loopback, with persisted state.
function devArgs(
  configs: readonly string[],
  ports: { inspector: number; port: number },
  productRoot: string,
): string[] {
  return [
    "dev",
    ...configs.flatMap((config) => ["-c", config]),
    "--ip",
    LOOPBACK,
    "--port",
    String(ports.port),
    "--inspector-port",
    String(ports.inspector),
    "--persist-to",
    join(productRoot, STATE_DIR),
  ];
}

/**
 * One `wrangler dev` for every Worker, under Node, behind the dispatcher (its first config), which reaches each by
 * service binding. Each Worker runs from its generated local config, which holds the local env alone under its full
 * name, so no `--env` is passed.
 */
export async function spawnWorkers(workers: readonly StackMember[], context: SpawnContext): Promise<StackProcess> {
  const dispatcher = writeDispatcher(
    context.productRoot,
    workers.map((worker) => worker.name),
  );

  const ports = { inspector: await freePort(), port: await freePort() };
  const configs = [dispatcher, ...workers.map((worker) => worker.config)];

  const program = appendArgs(
    peerProgram(context.productRoot, "wrangler", "wrangler"),
    devArgs(configs, ports, context.productRoot),
  );

  const child = await spawnGroup({
    cmd: [program.file, ...program.args],
    cwd: context.productRoot,
    env: context.env,
    name: "workers",
    onLine: context.onLine,
  });

  context.track(child);

  return {
    child,
    entry: true,
    inspector: ports.inspector,
    serves: workers.map((worker) => worker.dir),
    url: `http://${LOOPBACK}:${ports.port}`,
  };
}
