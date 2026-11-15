import type * as tls from "node:tls";

/** Reads from `socket` until `isDone` accepts what came; an error, a close too early or the timeout rejects. */
export function readUntil(socket: tls.TLSSocket, timeoutMs: number, isDone: (buf: Buffer) => boolean): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let received = Buffer.alloc(0);

    function settle(result: Buffer | Error): void {
      clearTimeout(timer);
      socket.off("data", onData);
      socket.off("error", settle);
      socket.off("close", onClose);

      if (result instanceof Error) reject(result);
      else resolve(result);
    }

    function onData(chunk: Buffer): void {
      received = Buffer.concat([received, chunk]);

      if (isDone(received)) settle(received);
    }

    function onClose(): void {
      settle(isDone(received) ? received : new Error("socket closed before complete response"));
    }

    const timer = setTimeout(() => {
      settle(new Error(`read timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    socket.on("data", onData);
    socket.once("error", settle);
    socket.once("close", onClose);
  });
}
