import { rmSync } from "node:fs";
import { join } from "node:path";

import type { Child } from "./child.ts";
import { clearOrphans } from "./clear-orphans.ts";
import { dockerInfo } from "./docker-info.ts";
import type { Edge } from "./edge-target.ts";
import { listenEdge } from "./listen-edge.ts";
import { LOCK_FILE, ORIGIN_PORT, RM_RETRIES, STATE_DIR, TEMP_DIR } from "./local.constants.ts";
import { renderTable } from "./render-table.ts";
import { resolverOf } from "./resolver-of.ts";
import { routeHosts } from "./route-hosts.ts";
import { spawnProcesses } from "./spawn-processes.ts";
import { stackEnv } from "./stack-env.ts";
import type { RunningStack, StackOptions } from "./stack-options.ts";
import { findLocalStack, localStackPath } from "./stack-state.ts";
import { stopGroups } from "./stop-groups.ts";
import { waitReady } from "./wait-ready.ts";
import { watchFailure } from "./watch-failure.ts";
import { writeLock } from "./write-lock.ts";
import { writeStackFile } from "./write-stack-file.ts";

/** What a start holds while it runs: the bound edge, the children so far, and the files to remove on a stop. */
type Launch = { children: Child[]; edge: Edge; lockFile: string; stackFile: string };

function refuseBusy(options: StackOptions): void {
  const running = findLocalStack(options.productRoot);

  if (running !== undefined) {
    throw new Error(
      `A local ${options.product} stack already runs from this checkout (pid ${running.pid}, ${running.origin}); ` +
        "stop it first",
    );
  }

  const containers = options.members.filter((member) => member.container === true).map((member) => member.dir);

  if (containers.length === 0) return;

  const docker = (options.docker ?? dockerInfo)();

  if (docker.ok) return;

  throw new Error(
    `${containers.join(", ")} needs Docker, and \`docker info\` failed (${docker.reason}): start Docker, or join ` +
      "the docker group and log in again",
  );
}

function originOf(options: StackOptions, edge: Edge): URL {
  const url = new URL(`http://${options.host}`);

  if (edge.port !== ORIGIN_PORT) url.port = String(edge.port);

  return url;
}

async function launch(options: StackOptions, held: Launch, cleanup: () => Promise<void>): Promise<RunningStack> {
  const origin = originOf(options, held.edge);

  writeStackFile(held.stackFile, origin.origin);
  await options.prepare?.();

  const shared = stackEnv(options.productRoot);

  const processes = await spawnProcesses(options.members, {
    ...shared,
    onLine: options.onLine,
    productRoot: options.productRoot,
    track: (child) => {
      held.children.push(child);
      writeLock(held.lockFile, held.children);
    },
  });

  await Promise.all(processes.map((each) => waitReady(`${each.url}/`, each.child)));

  const hosts = routeHosts(options, origin);

  held.edge.serve({ hosts, resolve: resolverOf(options, processes) });

  const state = join(options.productRoot, STATE_DIR);
  const table = renderTable({ ...shared, hosts, origin: origin.origin, processes, skipped: held.edge.skipped, state });

  return { ...watchFailure(held.children, cleanup), origin: origin.origin, processes, table };
}

/**
 * Starts the stack: refuses when one already runs in this checkout (or a container Worker has no Docker), clears
 * what a killed run left, binds the edge on the origin port, writes the state file, runs `prepare`, starts every
 * process, waits until each answers, then routes the edge to them. Any failure on the way stops what started,
 * closes the edge and removes the state and lock files and the children's temp dir.
 */
export async function startStack(options: StackOptions): Promise<RunningStack> {
  refuseBusy(options);

  const lockFile = join(options.productRoot, LOCK_FILE);
  const stackFile = localStackPath(options.productRoot);

  const temp = join(options.productRoot, TEMP_DIR);

  await clearOrphans(lockFile);
  // What a killed run's children left in the stack's temp dir; on win32 a stop is a force kill, which leaves it all.
  rmSync(temp, { force: true, maxRetries: RM_RETRIES, recursive: true });

  const edge = await listenEdge(options.originCandidate);
  const held: Launch = { children: [], edge, lockFile, stackFile };

  async function cleanup(): Promise<void> {
    await edge.close();
    await stopGroups(held.children);
    rmSync(temp, { force: true, maxRetries: RM_RETRIES, recursive: true });
    rmSync(stackFile, { force: true });
    rmSync(lockFile, { force: true });
  }

  try {
    return await launch(options, held, cleanup);
  } catch (error) {
    await cleanup();
    throw error;
  }
}
