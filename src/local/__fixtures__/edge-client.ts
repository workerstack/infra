import { createServer, request as httpRequest } from "node:http";
import type { AddressInfo } from "node:net";

import type { Edge } from "../edge-target.ts";
import { freePort } from "../free-port.ts";
import { listenEdge } from "../listen-edge.ts";
import { WORKER_HEADER } from "../local.constants.ts";

/** What a test opened; `closeAll` closes each. */
export function closers() {
  const open: (() => Promise<void>)[] = [];

  return {
    closeAll: async () => {
      await Promise.all(open.splice(0).map((close) => close()));
    },
    push: (close: () => Promise<void>) => open.push(close),
  };
}

/** A target that answers what it received as JSON, and echoes every byte back on an upgrade. */
export async function echoServer(track: ReturnType<typeof closers>): Promise<string> {
  const server = createServer((request, response) => {
    let body = "";

    request.on("data", (chunk: Buffer) => (body += chunk.toString()));
    request.on("end", () => {
      const { host } = request.headers;
      const worker = request.headers[WORKER_HEADER] ?? null;

      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ body, host, method: request.method, url: request.url, worker }));
    });
  });

  server.on("upgrade", (request, socket) => {
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: ${request.headers.upgrade}\r\nConnection: Upgrade\r\n\r\n`);
    socket.pipe(socket);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  track.push(() => new Promise((resolve) => server.close(() => resolve())));
  server.closeIdleConnections();

  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

/** An edge on a free port, closed with the rest. */
export async function openEdge(track: ReturnType<typeof closers>): Promise<Edge> {
  const opened = await listenEdge(await freePort());

  track.push(() => opened.close());

  return opened;
}

/** A request to the edge with the browser's Host, as `*.localhost` resolves in a browser. */
export function ask(
  opened: Edge,
  at: { host: string; path: string },
  init: { body?: string; method?: string } = {},
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const options = { headers: { host: at.host }, host: "127.0.0.1", method: init.method ?? "GET", path: at.path, port: opened.port };
    const request = httpRequest(options, (response) => {
      let text = "";

      response.on("data", (chunk: Buffer) => (text += chunk.toString()));
      response.on("end", () => resolve({ status: response.statusCode ?? 0, text }));
    });

    request.on("error", reject);
    request.end(init.body);
  });
}

/** Opens an upgrade through the edge, writes `ping` and resolves with what comes back. */
export function upgradeEcho(opened: Edge, host: string): Promise<{ echoed: string; status: number | undefined }> {
  return new Promise((resolve, reject) => {
    const headers = { connection: "Upgrade", host, upgrade: "vite-hmr" };
    const request = httpRequest({ headers, host: "127.0.0.1", path: "/", port: opened.port });

    request.on("upgrade", (response, socket) => {
      socket.once("data", (chunk: Buffer) => {
        resolve({ echoed: chunk.toString(), status: response.statusCode });
        socket.destroy();
      });
      socket.write("ping");
    });
    request.on("response", (response) => {
      let text = "";

      response.on("data", (chunk: Buffer) => (text += chunk.toString()));
      response.on("end", () => resolve({ echoed: text, status: response.statusCode }));
    });
    request.on("error", reject);
    request.end();
  });
}
