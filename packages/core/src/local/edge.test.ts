import { afterEach, describe, expect, it } from "vitest";

import { ask, closers, echoServer, openEdge, upgradeEcho } from "./__fixtures__/edge-client.ts";
import { freePort } from "./free-port.ts";

const track = closers();
const SITE = "example.localhost";

function noRoute(): undefined {
  return;
}

afterEach(track.closeAll);

describe("the edge while starting", () => {
  it("answers 503 to a request and to an upgrade", async () => {
    const opened = await openEdge(track);
    const reply = await ask(opened, { host: SITE, path: "/" });

    expect(reply.status).toBe(503);
    expect(reply.text).toContain("starting");
    await expect(upgradeEcho(opened, SITE)).resolves.toMatchObject({ status: 503 });
  });
});

describe("the edge proxying", () => {
  it("hands a Worker route to the dispatcher with the Worker's name, keeping Host", async () => {
    const target = await echoServer(track);
    const opened = await openEdge(track);

    opened.serve({ hosts: [SITE], resolve: () => ({ kind: "worker", name: "web-api-local", url: target }) });

    const reply = await ask(opened, { host: `${SITE}:${opened.port}`, path: "/api/v1?x=1" });

    expect(reply.status).toBe(200);
    expect(JSON.parse(reply.text)).toStrictEqual({
      body: "",
      host: `${SITE}:${opened.port}`,
      method: "GET",
      url: "/api/v1?x=1",
      worker: "web-api-local",
    });
  });
});

describe("the edge proxying to an app", () => {
  it("hands an app route to its Vite with Host kept and the body streamed", async () => {
    const target = await echoServer(track);
    const opened = await openEdge(track);
    const seen: [string, string][] = [];

    opened.serve({
      hosts: [SITE],
      resolve: (host, path) => {
        seen.push([host, path]);

        return { kind: "app", url: target };
      },
    });

    const reply = await ask(opened, { host: SITE, path: "/form" }, { body: "a=1", method: "POST" });

    expect(JSON.parse(reply.text)).toMatchObject({ body: "a=1", host: SITE, method: "POST", worker: null });
    expect(seen).toStrictEqual([[SITE, "/form"]]);
  });
});

describe("the edge proxying an upgrade", () => {
  it("pipes an upgrade both ways, as Vite's HMR socket needs", async () => {
    const target = await echoServer(track);
    const opened = await openEdge(track);

    opened.serve({ hosts: [SITE], resolve: () => ({ kind: "app", url: target }) });

    await expect(upgradeEcho(opened, SITE)).resolves.toStrictEqual({ echoed: "ping", status: 101 });
  });

  it("answers 502 naming the target when it is down", async () => {
    const opened = await openEdge(track);
    const down = `http://127.0.0.1:${await freePort()}`;

    opened.serve({ hosts: [SITE], resolve: () => ({ kind: "app", url: down }) });

    const reply = await ask(opened, { host: SITE, path: "/" });

    expect(reply.status).toBe(502);
    expect(reply.text).toContain(`${SITE} goes to ${down}, which did not answer`);
  });
});

describe("the edge's own pages", () => {
  it("names every package of a Vite Worker the stack leaves out, and how to run it", async () => {
    const opened = await openEdge(track);

    opened.serve({ hosts: [SITE], resolve: () => ({ dirs: ["site"], kind: "outside", why: "vite" }) });

    const reply = await ask(opened, { host: SITE, path: "/site" });

    expect(reply.status).toBe(503);
    expect(reply.text).toBe(
      `${SITE}/site is served by site: site runs under Vite and is not in local.apps, so the stack leaves it out; ` +
        "add it to local.apps to run it.\n",
    );
  });

  it("says which flag brings in an opt-in or --only-left-out Worker", async () => {
    const optIn = await openEdge(track);
    const notChosen = await openEdge(track);

    optIn.serve({ hosts: [SITE], resolve: () => ({ dirs: ["box", "box2"], kind: "outside", why: "opt-in" }) });
    notChosen.serve({ hosts: [SITE], resolve: () => ({ dirs: ["web"], kind: "outside", why: "not-chosen" }) });

    const withFlag = await ask(optIn, { host: SITE, path: "/" });
    const withoutOnly = await ask(notChosen, { host: SITE, path: "/" });

    expect(withFlag.text).toContain("start the stack with --with box, box2");
    expect(withoutOnly.text).toContain("this stack's --only left out");
  });

  it("answers 404 on a host with no route, listing the stack's hosts", async () => {
    const opened = await openEdge(track);

    opened.serve({ hosts: [SITE, `api.${SITE}`], resolve: noRoute });

    const reply = await ask(opened, { host: "other.localhost", path: "/" });

    expect(reply.status).toBe(404);
    expect(reply.text).toContain(`${SITE}, api.${SITE}`);
  });
});
