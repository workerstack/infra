import type * as tls from "node:tls";

import { connectTls } from "./connect-tls.ts";
import type { ProbeTarget } from "./probe-target.ts";
import { CONNECT_TIMEOUT_MS } from "./probe.constants.ts";

/** Runs `use` on a TLS socket to `target` offering `alpn`, and closes the socket however `use` ends. */
export async function withSocket<T>(
  target: ProbeTarget,
  alpn: readonly string[],
  use: (socket: tls.TLSSocket) => Promise<T>,
): Promise<T> {
  const socket = await connectTls({ alpn, host: target.host, port: target.port, timeoutMs: CONNECT_TIMEOUT_MS });

  try {
    return await use(socket);
  } finally {
    socket.destroy();
  }
}
