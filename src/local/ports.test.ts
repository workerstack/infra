import { createServer, type Server } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { freePort } from "./free-port.ts";
import { portOwner } from "./port-owner.ts";

const servers: Server[] = [];

afterEach(() => {
  for (const server of servers.splice(0)) server.close();
});

function listen(port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", reject);
    server.listen({ host: "::", ipv6Only: false, port }, () => {
      resolve(server);
    });
    servers.push(server);
  });
}

describe("ports", () => {
  it("picks a free port that binds", async () => {
    const port = await freePort();

    expect(port).toBeGreaterThan(0);
    await expect(listen(port)).resolves.toBeDefined();
  });

  it("names the process listening on a port, and nobody on a free one", async () => {
    const port = await freePort();

    expect(portOwner(port)).toBeUndefined();

    await listen(port);

    expect(portOwner(port)).toMatch(new RegExp(`^pid ${process.pid}: `));
  });
});
