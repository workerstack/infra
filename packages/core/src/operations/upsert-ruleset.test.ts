import { describe, expect, it } from "vitest";

import { recordingClient, zoneHolding } from "./__fixtures__/recording-client.ts";
import { upsertRuleset } from "./upsert-ruleset.ts";

const RULES = [{ description: "d" }];

describe("upsertRuleset", () => {
  it("PUTs the rules into the existing ruleset of the phase", async () => {
    const { calls, client } = recordingClient(zoneHolding({ http_ratelimit: [] }));

    await upsertRuleset(client, "http_ratelimit", RULES);

    expect(calls).toStrictEqual([
      { body: undefined, method: "GET", path: "/zones/zid/rulesets" },
      { body: { rules: RULES }, method: "PUT", path: "/zones/zid/rulesets/rs_http_ratelimit" },
    ]);
  });

  it("POSTs a zone ruleset when the phase has none", async () => {
    const { calls, client } = recordingClient(zoneHolding({ other: [] }));

    await upsertRuleset(client, "http_ratelimit", RULES);

    expect(calls[1]).toStrictEqual({
      body: { kind: "zone", name: "zone", phase: "http_ratelimit", rules: RULES },
      method: "POST",
      path: "/zones/zid/rulesets",
    });
  });
});
