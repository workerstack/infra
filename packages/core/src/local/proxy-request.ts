import { type IncomingMessage, request as httpRequest, type ServerResponse } from "node:http";

import { edgeDecision } from "./edge-decision.ts";
import type { Routing } from "./edge-target.ts";
import { BAD_GATEWAY } from "./local.constants.ts";
import { upstreamOptions } from "./upstream-options.ts";

const PLAIN = { "content-type": "text/plain; charset=utf-8" };

/** Answers one request at the edge, or streams it to its target and the target's reply back. */
export function proxyRequest(routing: Routing | undefined, request: IncomingMessage, response: ServerResponse): void {
  const decision = edgeDecision(routing, request);

  if (decision.kind === "answer") {
    response.writeHead(decision.status, PLAIN).end(decision.text);

    return;
  }

  const { target } = decision;

  const upstream = httpRequest(upstreamOptions(request, target), (reply) => {
    response.writeHead(reply.statusCode ?? BAD_GATEWAY, reply.statusMessage, reply.rawHeaders);
    reply.pipe(response);
  });

  upstream.on("error", (error: NodeJS.ErrnoException) => {
    if (response.headersSent) {
      response.destroy();

      return;
    }

    const code = error.code ?? error.message;

    response
      .writeHead(BAD_GATEWAY, PLAIN)
      .end(`${request.headers.host ?? ""} goes to ${target.url}, which did not answer (${code}).\n`);
  });
  request.pipe(upstream);
}
