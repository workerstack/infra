import type * as tls from "node:tls";

/** The ALPN name the server chose, or `null` when it chose none. */
export function alpnName(socket: tls.TLSSocket): string | null {
  const name = socket.alpnProtocol;

  return name === false ? null : name;
}
