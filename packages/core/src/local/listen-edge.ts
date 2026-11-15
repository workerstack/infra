import { createServer, type Server } from "node:http";

import type { Edge, Routing } from "./edge-target.ts";
import { ANY_HOST, ERRNO_IN_USE, ORIGIN_PORT } from "./local.constants.ts";
import { portOwner } from "./port-owner.ts";
import { proxyRequest } from "./proxy-request.ts";
import { proxyUpgrade } from "./proxy-upgrade.ts";
import { skipReason } from "./skip-reason.ts";

// Listens on every address (one dual-stack bind on `::`): `undefined` once bound, else the errno.
function bind(server: Server, port: number): Promise<string | undefined> {
  return new Promise((resolve) => {
    function onError(error: NodeJS.ErrnoException): void {
      resolve(error.code ?? error.message);
    }

    server.once("error", onError);
    server.listen({ host: ANY_HOST, ipv6Only: false, port }, () => {
      server.off("error", onError);
      resolve(undefined);
    });
  });
}

// Binds the candidate, else a free port with the reason the candidate was skipped.
async function bindEither(server: Server, candidate: number): Promise<string | undefined> {
  const code = await bind(server, candidate);

  if (code === undefined) return undefined;

  const fallback = await bind(server, 0);

  if (fallback !== undefined) throw new Error(`the edge did not bind a free port (${fallback})`);

  return skipReason(candidate, code, code === ERRNO_IN_USE ? portOwner(candidate) : undefined);
}

/**
 * The edge: an HTTP server on the origin port that proxies each request and upgrade to what its routing names,
 * keeping the browser's Host. It binds the candidate (80, so the origin has no port) or, when that fails, a free
 * port with the reason.
 */
export async function listenEdge(candidate: number = ORIGIN_PORT): Promise<Edge> {
  let routing: Routing | undefined;

  const server = createServer((request, response) => {
    proxyRequest(routing, request, response);
  });

  server.on("upgrade", (request, socket, head) => {
    proxyUpgrade(routing, request, { head, socket });
  });

  const skipped = await bindEither(server, candidate);
  const address = server.address();

  if (address === null || !(address instanceof Object)) throw new Error("the edge has no TCP port");

  return {
    close: () =>
      new Promise((resolve) => {
        server.close(() => {
          resolve();
        });
        server.closeAllConnections();
      }),
    port: address.port,
    serve: (served) => {
      routing = served;
    },
    skipped,
  };
}
