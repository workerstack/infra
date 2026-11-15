import { type IncomingMessage, request as httpRequest, STATUS_CODES } from "node:http";
import type { Duplex } from "node:stream";

import { edgeDecision } from "./edge-decision.ts";
import type { Routing } from "./edge-target.ts";
import { BAD_GATEWAY } from "./local.constants.ts";
import { rawHead } from "./raw-head.ts";
import { upstreamOptions } from "./upstream-options.ts";

// Joins the browser's socket and the target's both ways once the target upgraded.
function join(socket: Duplex, head: Buffer, reply: { up: IncomingMessage; upHead: Buffer; upSocket: Duplex }): void {
  const { up, upHead, upSocket } = reply;

  upSocket.on("error", () => socket.destroy());
  socket.on("close", () => upSocket.destroy());
  upSocket.on("close", () => socket.destroy());
  socket.write(rawHead(up.statusCode ?? BAD_GATEWAY, up.statusMessage ?? "", up.rawHeaders));

  if (upHead.length > 0) socket.write(upHead);

  if (head.length > 0) upSocket.write(head);

  upSocket.pipe(socket);
  socket.pipe(upSocket);
}

/** Pipes an upgrade (Vite's HMR socket) both ways to its target, or answers it at the edge. */
export function proxyUpgrade(
  routing: Routing | undefined,
  request: IncomingMessage,
  link: { head: Buffer; socket: Duplex },
): void {
  const { head, socket } = link;
  const decision = edgeDecision(routing, request);

  socket.on("error", () => socket.destroy());

  if (decision.kind === "answer") {
    const message = STATUS_CODES[decision.status] ?? "";

    socket.end(`${rawHead(decision.status, message, ["connection", "close"])}${decision.text}`);

    return;
  }

  const upstream = httpRequest(upstreamOptions(request, decision.target));

  upstream.on("upgrade", (up, upSocket, upHead) => {
    join(socket, head, { up, upHead, upSocket });
  });
  // The target answered without upgrading: relay its answer.
  upstream.on("response", (reply) => {
    socket.write(rawHead(reply.statusCode ?? BAD_GATEWAY, reply.statusMessage ?? "", reply.rawHeaders));
    reply.pipe(socket);
  });
  upstream.on("error", () => socket.destroy());
  upstream.end();
}
