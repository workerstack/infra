import type { Http11Result } from "./http11-result.ts";
import { parseHttp11Head } from "./parse-http11-head.ts";
import type { ProbeTarget } from "./probe-target.ts";
import { ALPN_HTTP_1_1, DEFAULT_HTTPS_PORT, HEADER_BLOCK_END, READ_TIMEOUT_MS } from "./probe.constants.ts";
import { readUntil } from "./read-until.ts";
import { withSocket } from "./with-socket.ts";

/** A `HEAD /` over HTTP/1.1: the status line and the alt-svc header, or the error. */
export async function probeHttp11(target: ProbeTarget): Promise<Http11Result> {
  const host = target.port === DEFAULT_HTTPS_PORT ? target.host : `${target.host}:${target.port}`;

  try {
    return await withSocket(target, [ALPN_HTTP_1_1], async (socket) => {
      socket.write(`HEAD / HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`);

      const raw = await readUntil(socket, READ_TIMEOUT_MS, (buf) => buf.includes(HEADER_BLOCK_END));
      const { altSvc, statusLine } = parseHttp11Head(raw.toString("latin1"));

      return { altSvc, kind: "ok", statusLine } as const;
    });
  } catch (error) {
    return { kind: "error", message: error instanceof Error ? error.message : String(error) };
  }
}
