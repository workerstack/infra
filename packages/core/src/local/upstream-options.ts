import type { IncomingMessage, RequestOptions } from "node:http";

import type { ProxyTarget } from "./edge-target.ts";
import { WORKER_HEADER } from "./local.constants.ts";

/**
 * The request to the target: the browser's method, path and headers, Host kept; a Worker's is named for the
 * dispatcher.
 */
export function upstreamOptions(request: IncomingMessage, target: ProxyTarget): RequestOptions {
  const url = new URL(target.url);
  const headers = { ...request.headers, ...(target.kind === "worker" && { [WORKER_HEADER]: target.name }) };

  return { headers, host: url.hostname, method: request.method, path: request.url, port: url.port };
}
