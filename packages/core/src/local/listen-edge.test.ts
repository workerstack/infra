import { createServer } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { closers } from "./__fixtures__/edge-client.ts";
import { freePort } from "./free-port.ts";
import { listenEdge } from "./listen-edge.ts";
import { skipReason } from "./skip-reason.ts";

const track = closers();

// Holds `port` on every address until the test ends.
async function hold(port: number): Promise<void> {
  const server = createServer();

  await new Promise<void>((resolve) => server.listen({ host: "::", ipv6Only: false, port }, resolve));
  track.push(() => new Promise((resolve) => server.close(() => resolve())));
}

afterEach(track.closeAll);

describe("listenEdge", () => {
  it("takes the candidate when it binds", async () => {
    const candidate = await freePort();
    const opened = await listenEdge(candidate);

    track.push(() => opened.close());

    expect(opened.port).toBe(candidate);
    expect(opened.skipped).toBeUndefined();
  });

  it("binds a free port when the candidate is busy, naming its owner", async () => {
    const held = await freePort();

    await hold(held);

    const opened = await listenEdge(held);

    track.push(() => opened.close());

    expect(opened.port).not.toBe(held);
    expect(opened.skipped).toContain(`port ${held} is busy (pid ${process.pid}`);
  });

  it("says how to allow a privileged port", () => {
    expect(skipReason(80, "EACCES")).toBe(
      "port 80 needs privileges; allow it once with `sudo sysctl -w net.ipv4.ip_unprivileged_port_start=80`",
    );
    expect(skipReason(80, "EADDRNOTAVAIL")).toBe("port 80 did not bind (EADDRNOTAVAIL)");
    expect(skipReason(80, "EADDRINUSE")).toBe("port 80 is busy");
  });
});
