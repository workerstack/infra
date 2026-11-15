import { existsSync, readFileSync, readdirSync } from "node:fs";
import type { Server } from "node:net";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  FIXTURE_HOST,
  fixtureOptions,
  fixtureProduct,
  fixtureStack,
  removeRoot,
  tempRoot,
} from "./__fixtures__/launcher-fixture.ts";
import { ask, textOf, atEdge, hold, lockFileOf, seen, stackFileOf } from "./__fixtures__/launcher-probes.ts";
import { alive } from "./__fixtures__/process-probes.ts";
import { freePort } from "./free-port.ts";
import { TEMP_DIR, WORKER_HEADER } from "./local.constants.ts";
import type { RunningStack } from "./stack-options.ts";
import { startStack } from "./start-stack.ts";

// A real `wrangler dev` and a fake app `vite`, under a temp root with its own registry, shared by the tests.
const BOOT = 120_000;
const root = tempRoot();
const servers: Server[] = [];
/** The port the test holds, and the stack the tests share. */

type Shared = { held: number; stack?: RunningStack };

const state: Shared = { held: 0 };

function running(): RunningStack {
  if (state.stack === undefined) throw new Error("the stack did not start");

  return state.stack;
}

beforeAll(async () => {
  state.held = await freePort();
  await hold(state.held, servers);
  state.stack = await startStack({ ...fixtureOptions(root, fixtureProduct(root, "one")), originCandidate: state.held });
}, BOOT);

afterAll(async () => {
  await state.stack?.stop();

  for (const server of servers) server.close();
  removeRoot(root);
});

describe("a started stack", () => {
  it("binds the origin on a free port when its candidate is busy, and names the origin in its state file", () => {
    const stack = running();

    expect(stack.origin).toMatch(new RegExp(`^http://${FIXTURE_HOST}:\\d+$`));
    expect(stack.origin).not.toBe(`http://${FIXTURE_HOST}:${state.held}`);
    expect(stack.table).toContain(`port ${state.held} is busy (pid ${process.pid}`);
    expect(stack.processes.map((each) => [each.child.name, each.serves])).toStrictEqual([
      ["workers", ["a", "b", "d"]],
      ["e", ["e"]],
    ]);
    expect(JSON.parse(readFileSync(stackFileOf(root), "utf8"))).toMatchObject({
      origin: stack.origin,
      pid: process.pid,
    });
  });

  it("hands a request to the Worker the header names, and lists the Workers otherwise", async () => {
    const none = await ask(running(), undefined);

    expect(none.status).toBe(404);
    expect(await none.text()).toBe(`no ${WORKER_HEADER} header; its Workers: fx-a-local, fx-b-local, fx-d-local\n`);
    expect(await textOf(ask(running(), "fx-c-local"))).toContain(`${WORKER_HEADER}: fx-c-local is not in the stack`);
    expect(await textOf(ask(running(), "fx-a-local", "?m=first"))).toBe("sent");
    expect(await seen(running(), "first")).toBe("one first");
    expect(await textOf(ask(running(), "fx-d-local"))).toBe("generated one one-secret");
  });
});

describe("the edge of a started stack", () => {
  it("routes each host by the prod routes to its Worker or app, keeping the Host", async () => {
    const { port } = new URL(running().origin);

    expect(await textOf(atEdge(running(), FIXTURE_HOST, "/a?m=edge"))).toBe("sent");
    expect(await seen(running(), "edge")).toBe("one edge");
    expect(await textOf(atEdge(running(), `b.${FIXTURE_HOST}`, "/host"))).toBe(`b.${FIXTURE_HOST}:${port}`);
    expect(await textOf(atEdge(running(), FIXTURE_HOST, "/e/page"))).toBe("app one /e/page");
    expect(running().table).toContain(`http://b.${FIXTURE_HOST}:${port}`);
  });

  it("answers a left-out Vite package and an unrouted path with a page", async () => {
    const outside = await atEdge(running(), FIXTURE_HOST, "/c");

    expect(outside.status).toBe(503);
    expect(await outside.text()).toContain("c runs under Vite and is not in local.apps");

    const unrouted = await atEdge(running(), FIXTURE_HOST, "/");

    expect(unrouted.status).toBe(404);
    expect(await unrouted.text()).toContain(`http://b.${FIXTURE_HOST}:${new URL(running().origin).port}`);
  });

  it("refuses a second start in the same checkout, naming the running one", async () => {
    await expect(startStack(fixtureOptions(root, fixtureStack(root)))).rejects.toThrow(
      `A local fx stack already runs from this checkout (pid ${process.pid}, ${running().origin}); stop it first`,
    );
  });
});

describe("a stopped stack", () => {
  it(
    "stops every child and removes its state, its lock and the temp dir its children wrote to",
    async () => {
      const pids = running().processes.map((each) => each.child.pid);
      const temp = join(root, TEMP_DIR);

      expect(readdirSync(temp).filter((entry) => entry.startsWith("miniflare-")).length).toBeGreaterThan(0);

      await running().stop();
      state.stack = undefined;
      expect(pids.filter((pid) => alive(pid))).toStrictEqual([]);
      expect(existsSync(stackFileOf(root))).toBe(false);
      expect(existsSync(lockFileOf(root))).toBe(false);
      expect(existsSync(temp)).toBe(false);
    },
    BOOT,
  );
});
