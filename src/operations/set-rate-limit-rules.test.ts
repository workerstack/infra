import { describe, expect, it } from "vitest";

import { recordingClient, rulesOf, zoneConfig, zoneHolding } from "./__fixtures__/recording-client.ts";
import { setRateLimitRules } from "./set-rate-limit-rules.ts";

const EXPECTED = {
  action: "block",
  description: "api",
  enabled: true,
  expression: "E",
  ratelimit: { characteristics: ["cf.colo.id", "ip.src"], mitigation_timeout: 10, period: 10, requests_per_period: 5 },
};

describe("setRateLimitRules", () => {
  it("sends nothing when the config has no rules", async () => {
    const { calls, client } = recordingClient();

    await setRateLimitRules(client, zoneConfig());

    expect(calls).toStrictEqual([]);
  });

  it("writes a block rule with its limits to the ratelimit phase", async () => {
    const { calls, client } = recordingClient(zoneHolding({ http_ratelimit: [] }));
    const rule = { description: "api", expression: "E", requestsPerPeriod: 5 };

    await setRateLimitRules(client, zoneConfig({ rateLimit: [rule] }));

    expect(calls[1]?.path).toBe("/zones/zid/rulesets/rs_http_ratelimit");
    expect(rulesOf(calls[1])).toStrictEqual([EXPECTED]);
  });
});
