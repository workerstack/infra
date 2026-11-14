import { describe, expect, it } from "vitest";

import { recordingClient, zoneHolding } from "./__fixtures__/recording-client.ts";
import { getRulesetRules } from "./get-ruleset-rules.ts";

describe("getRulesetRules", () => {
  it("returns the rules of the phase's ruleset", async () => {
    const rules = [{ action: "block", description: "d", enabled: true }];
    const { client } = recordingClient(zoneHolding({ http_ratelimit: rules }));

    expect(await getRulesetRules(client, "http_ratelimit")).toStrictEqual(rules);
  });

  it("returns none, and reads no detail, when the phase has no ruleset", async () => {
    const { calls, client } = recordingClient(zoneHolding({}));

    expect(await getRulesetRules(client, "http_ratelimit")).toStrictEqual([]);
    expect(calls).toHaveLength(1);
  });

  it("returns none when the detail carries no rules", async () => {
    const { client } = recordingClient((_method, path) =>
      path.endsWith("/rulesets") ? [{ id: "x", phase: "p" }] : { id: "x" },
    );

    expect(await getRulesetRules(client, "p")).toStrictEqual([]);
  });
});
