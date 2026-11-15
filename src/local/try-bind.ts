import { createServer } from "node:net";

import { ANY_HOST } from "./local.constants.ts";

/** What a bind gave: the port it bound, or the errno it failed with. */
type Bound = { code: string } | { port: number };

/** Binds `port` on every address (one dual-stack bind on `::`) and releases it: the port, or the bind's errno. */
export function tryBind(port: number): Promise<Bound> {
  return new Promise((resolve) => {
    const server = createServer();

    server.once("error", (error: NodeJS.ErrnoException) => {
      resolve({ code: error.code ?? "" });
    });
    server.listen({ host: ANY_HOST, ipv6Only: false, port }, () => {
      const address = server.address();
      const bound = address !== null && address instanceof Object ? address.port : port;

      server.close(() => {
        resolve({ port: bound });
      });
    });
  });
}
