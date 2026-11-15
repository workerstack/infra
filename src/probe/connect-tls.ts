import * as tls from "node:tls";

import type { TlsConnect } from "./tls-connect.ts";

/** Opens a TLS connection offering `alpn`; a failure or the timeout rejects and closes the socket. */
export function connectTls(input: TlsConnect): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    function fail(error: Error): void {
      clearTimeout(timer);
      socket.destroy();
      // A host with several addresses fails as one AggregateError with no message of its own.
      reject(error instanceof AggregateError && error.errors[0] instanceof Error ? error.errors[0] : error);
    }

    const timer = setTimeout(() => {
      fail(new Error(`TLS timeout after ${input.timeoutMs}ms`));
    }, input.timeoutMs);

    const socket = tls.connect(
      { ALPNProtocols: [...input.alpn], host: input.host, port: input.port, servername: input.host },
      () => {
        clearTimeout(timer);
        socket.off("error", fail);
        resolve(socket);
      },
    );

    socket.once("error", fail);
  });
}
