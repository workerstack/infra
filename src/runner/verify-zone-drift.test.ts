import { expect, it } from "vitest";

import type { ZoneConfigInput } from "../schema/zone.ts";
import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { zoneAnswer } from "./__fixtures__/zone-answer.ts";
import type { ZoneLive } from "./__fixtures__/zone-answer.ts";
import { zoneConfig } from "./__fixtures__/zone-config.ts";
import { verifyZoneConfig } from "./verify-zone-config.ts";

const ORPHAN_CONNECTOR = {
  description: "orphan-cc",
  enabled: true,
  expression: "E_X",
  parameters: { host: "orphan.r2" },
  provider: "cloudflare_r2",
};

async function verify(live: ZoneLive, config: Partial<ZoneConfigInput>): ReturnType<typeof verifyZoneConfig> {
  const { client } = fakeClient(zoneAnswer(live));

  return await verifyZoneConfig(client, zoneConfig(config));
}

it("verifyZoneConfig surfaces declared-only as missing and live-only as extra across all 3 ops", async () => {
  const result = await verify(
    {
      connectors: [ORPHAN_CONNECTOR],
      routes: [{ id: "rt_orphan", pattern: "example.com/zombie", script: null }],
    },
    { transforms: { urlRewrites: [{ description: "t_decl", expression: "E_T", pathExpression: "X" }] } },
  );

  expect(result.transforms.missing).toHaveLength(1);
  expect(result.transforms.missing[0]).toMatchObject({ description: "t_decl" });
  expect(result.transforms.extra).toStrictEqual([]);
  expect(result.cloudConnectors.extra).toHaveLength(1);
  expect(result.cloudConnectors.extra[0]).toMatchObject({ description: "orphan-cc" });
  expect(result.cloudConnectors.missing).toStrictEqual([]);
  expect(result.disabledWorkerRoutes.extra).toStrictEqual(["example.com/zombie"]);
  expect(result.disabledWorkerRoutes.missing).toStrictEqual([]);
});

it("verifyZoneConfig transforms drift keys on (description, expression, pathExpression)", async () => {
  const live = {
    action: "rewrite",
    action_parameters: { uri: { path: { expression: "PE" } } },
    description: "D",
    enabled: true,
    expression: "E",
  };

  const result = await verify(
    { rulesets: { http_request_transform: [live] } },
    { transforms: { urlRewrites: [{ description: "D", expression: "E", pathExpression: "PE" }] } },
  );

  expect(result.transforms.missing).toStrictEqual([]);
  expect(result.transforms.extra).toStrictEqual([]);
});

it("verifyZoneConfig CC drift uses the (provider, expression, host) natural key and ignores id churn", async () => {
  const live = {
    description: "x",
    enabled: true,
    expression: "E",
    id: "NEW_HEX_1",
    parameters: { host: "H" },
    provider: "cloudflare_r2",
  };

  const result = await verify(
    { connectors: [live] },
    { cloudConnectors: [{ description: "x", expression: "E", host: "H" }] },
  );

  expect(result.cloudConnectors.missing).toStrictEqual([]);
  expect(result.cloudConnectors.extra).toStrictEqual([]);
});

it("verifyZoneConfig worker-routes drift uses the pattern as natural key", async () => {
  const result = await verify(
    { routes: [{ id: "r1", pattern: "example.com/p", script: null }] },
    { disabledWorkerRoutes: ["example.com/p"] },
  );

  expect(result.disabledWorkerRoutes.missing).toStrictEqual([]);
  expect(result.disabledWorkerRoutes.extra).toStrictEqual([]);
});
