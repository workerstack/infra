import { describe, expect, it } from "vitest";

import { parseZoneConfig } from "../schema/zone.ts";
import type { Answer } from "../shared/__fixtures__/fake-client.ts";
import { fakeClient, writes } from "../shared/__fixtures__/fake-client.ts";
import { getDisabledWorkerRoutes, setDisabledWorkerRoutes } from "./worker-routes.ts";

const ROUTES_PATH = "/zones/zid/workers/routes";

type Route = { id: string; pattern: string; script?: null | string };

function answer(routes: Route[]): Answer {
  return ({ method }) => (method === "GET" ? routes : { id: "new_id" });
}

function config(disabledWorkerRoutes: string[]): ReturnType<typeof parseZoneConfig> {
  return parseZoneConfig({ disabledWorkerRoutes, domain: "example.com", zoneId: "zid" });
}

async function run(
  routes: Route[],
  declared: string[],
): Promise<{ calls: ReturnType<typeof writes>; lines: string[] }> {
  const { calls, client } = fakeClient(answer(routes));
  const lines: string[] = [];

  await setDisabledWorkerRoutes(client, config(declared), (line) => lines.push(line));

  return { calls: writes(calls), lines };
}

describe("getDisabledWorkerRoutes", () => {
  it("keeps only routes whose script is null or undefined", async () => {
    const { client } = fakeClient(
      answer([
        { id: "r1", pattern: "example.com/cdn/p/*", script: null },
        { id: "r2", pattern: "example.com/cdn/unsigned", script: undefined },
        { id: "r3", pattern: "example.com/api/*", script: "api-worker" },
      ]),
    );

    expect(await getDisabledWorkerRoutes(client)).toStrictEqual(["example.com/cdn/p/*", "example.com/cdn/unsigned"]);
  });

  it("returns an empty list when the zone has no routes", async () => {
    const { client } = fakeClient(answer([]));

    expect(await getDisabledWorkerRoutes(client)).toStrictEqual([]);
  });
});

describe("setDisabledWorkerRoutes", () => {
  it("deletes an orphan bypass route that is not declared", async () => {
    const { calls } = await run(
      [
        { id: "r_keep", pattern: "example.com/keep", script: null },
        { id: "r_orphan", pattern: "example.com/orphan", script: null },
      ],
      ["example.com/keep"],
    );

    expect(calls).toStrictEqual([{ body: undefined, method: "DELETE", path: `${ROUTES_PATH}/r_orphan` }]);
  });

  it("skips a declared pattern that is already null", async () => {
    const { calls } = await run([{ id: "r_null", pattern: "example.com/p", script: null }], ["example.com/p"]);

    expect(calls).toHaveLength(0);
  });

  it("never deletes a route that has a script", async () => {
    const { calls } = await run([{ id: "r_real", pattern: "example.com/api/*", script: "my-worker" }], []);

    expect(calls).toHaveLength(0);
  });
});

describe("setDisabledWorkerRoutes creates and flips", () => {
  it("POSTs a declared pattern missing from live", async () => {
    const { calls } = await run([], ["example.com/cdn/p/*"]);

    expect(calls).toStrictEqual([
      { body: { pattern: "example.com/cdn/p/*", script: null }, method: "POST", path: ROUTES_PATH },
    ]);
  });

  it("PUTs script null over a live script for a declared pattern", async () => {
    const { calls } = await run([{ id: "r_pre", pattern: "example.com/p", script: "old-worker" }], ["example.com/p"]);

    expect(calls).toStrictEqual([
      { body: { pattern: "example.com/p", script: null }, method: "PUT", path: `${ROUTES_PATH}/r_pre` },
    ]);
  });
});

describe("setDisabledWorkerRoutes logging", () => {
  it("logs one line per orphan delete", async () => {
    const { lines } = await run(
      [
        { id: "r_o1", pattern: "example.com/o1", script: null },
        { id: "r_o2", pattern: "example.com/o2", script: null },
      ],
      [],
    );

    expect(lines).toStrictEqual([
      "  → deleting orphan bypass route: example.com/o1",
      "  → deleting orphan bypass route: example.com/o2",
    ]);
  });
});

describe("setDisabledWorkerRoutes edge cases", () => {
  it("sends only the GET when config and live are both empty", async () => {
    const { calls, client } = fakeClient(answer([]));

    await setDisabledWorkerRoutes(client, config([]), () => {});

    expect(calls).toStrictEqual([{ body: undefined, method: "GET", path: ROUTES_PATH }]);
  });

  it("handles a mix of orphans, a flip and a new route and leaves real workers alone", async () => {
    const { calls } = await run(
      [
        { id: "r_o1", pattern: "example.com/orphan1", script: null },
        { id: "r_o2", pattern: "example.com/orphan2", script: null },
        { id: "r_flip", pattern: "example.com/flip", script: "stale-worker" },
        { id: "r_real", pattern: "example.com/api/*", script: "api-worker" },
      ],
      ["example.com/flip", "example.com/new"],
    );

    expect(calls.map(({ method, path }) => `${method} ${path}`)).toStrictEqual([
      `DELETE ${ROUTES_PATH}/r_o1`,
      `DELETE ${ROUTES_PATH}/r_o2`,
      `PUT ${ROUTES_PATH}/r_flip`,
      `POST ${ROUTES_PATH}`,
    ]);
  });
});
