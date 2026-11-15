import { describe, expect, it } from "vitest";

import type { ZoneConfigInput } from "../schema/zone.ts";
import { recordingClient, rulesOf, zoneConfig, zoneHolding } from "./__fixtures__/recording-client.ts";
import type { Recorded } from "./__fixtures__/recording-client.ts";
import { setTransformRules } from "./set-transform-rules.ts";

type Rewrites = NonNullable<ZoneConfigInput["transforms"]>["urlRewrites"];

async function put(urlRewrites: Rewrites): Promise<Recorded | undefined> {
  const { calls, client } = recordingClient(zoneHolding({ http_request_transform: [] }));

  await setTransformRules(client, zoneConfig({ transforms: { urlRewrites } }));

  return calls.find((call) => call.method === "PUT");
}

describe("setTransformRules", () => {
  it("PUTs an empty rules array when the config has no rewrites, clearing drift", async () => {
    const call = await put([]);

    expect(call?.path).toBe("/zones/zid/rulesets/rs_http_request_transform");
    expect(call?.body).toStrictEqual({ rules: [] });
  });

  it("maps a rewrite to a rewrite action on the uri path expression", async () => {
    const call = await put([{ description: "d", enabled: true, expression: "E", pathExpression: "P" }]);

    expect(rulesOf(call)).toStrictEqual([
      {
        action: "rewrite",
        action_parameters: { uri: { path: { expression: "P" } } },
        description: "d",
        enabled: true,
        expression: "E",
      },
    ]);
  });

  it("keeps the declared order", async () => {
    const call = await put([
      { description: "first", expression: "E1", pathExpression: "P1" },
      { description: "second", expression: "E2", pathExpression: "P2" },
    ]);

    expect(JSON.stringify(rulesOf(call))).toMatch(/first.*second/u);
  });

  it("pushes a disabled rule rather than filtering it", async () => {
    const call = await put([{ description: "d", enabled: false, expression: "E", pathExpression: "P" }]);

    expect(JSON.stringify(rulesOf(call))).toContain('"enabled":false');
  });
});
