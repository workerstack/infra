import { createServer, type Server } from "node:net";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import { LOCK_FILE, WORKER_HEADER } from "../local.constants.ts";
import type { RunningStack } from "../stack-options.ts";
import { localStackPath } from "../stack-state.ts";

export function lockFileOf(productRoot: string): string {
  return join(productRoot, LOCK_FILE);
}

export function stackFileOf(productRoot: string): string {
  return localStackPath(productRoot);
}

function workersUrl(stack: RunningStack): string {
  const url = stack.processes.find((each) => each.child.name === "workers")?.url;

  if (url === undefined) throw new Error("no workers process");

  return url;
}

/** Asks the dispatcher directly, naming `worker` in the header when given. */
export function ask(stack: RunningStack, worker: string | undefined, query = ""): Promise<Response> {
  return fetch(`${workersUrl(stack)}/${query}`, { headers: worker === undefined ? {} : { [WORKER_HEADER]: worker } });
}

/** `b`'s reply once its queue consumer stored `message`, or its last reply after 10 s. */
export async function seen(stack: RunningStack, message: string, left = 100): Promise<string> {
  const response = await ask(stack, "fx-b-local");
  const text = await response.text();

  if (text.endsWith(` ${message}`) || left === 0) return text;

  await sleep(100);

  return seen(stack, message, left - 1);
}

/** A request through the edge at `host` and `path`, on the origin's port. */
export function atEdge(stack: RunningStack, host: string, path: string): Promise<Response> {
  const url = new URL(path, stack.origin);

  url.hostname = host;

  return fetch(url);
}

/** Holds `port` on every address, as another program would; resolves either way. */
export function hold(port: number, servers: Server[]): Promise<void> {
  return new Promise((resolve) => {
    const server = createServer();

    server.once("error", () => {
      resolve();
    });
    server.listen({ host: "::", ipv6Only: false, port }, () => {
      resolve();
    });
    servers.push(server);
  });
}

/** The body of a response still on its way. */
export async function textOf(pending: Promise<Response>): Promise<string> {
  const response = await pending;

  return response.text();
}
