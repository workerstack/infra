import { describe, expect, it } from "vitest";

import type { CacheRuleInput } from "../schema/cache.ts";
import { recordingClient, rulesOf, zoneConfig, zoneHolding } from "./__fixtures__/recording-client.ts";
import { setCacheRules } from "./set-cache-rules.ts";

async function sentRules(rule: Partial<CacheRuleInput>): Promise<object[]> {
  const { calls, client } = recordingClient(zoneHolding({ http_request_cache_settings: [] }));

  await setCacheRules(client, zoneConfig({ cache: [{ description: "d", expression: "E", ...rule }] }));

  return rulesOf(calls[1]);
}

describe("setCacheRules actions", () => {
  it("sends nothing when the config has no rules", async () => {
    const { calls, client } = recordingClient();

    await setCacheRules(client, zoneConfig());

    expect(calls).toStrictEqual([]);
  });

  it("turns caching off for a bypass rule", async () => {
    expect(await sentRules({ bypass: true, edgeTtl: 5 })).toStrictEqual([
      {
        action: "set_cache_settings",
        action_parameters: { cache: false },
        description: "d",
        enabled: true,
        expression: "E",
      },
    ]);
  });
});

describe("setCacheRules parameters", () => {
  it("overrides the origin's TTLs when the rule sets them", async () => {
    const [rule] = await sentRules({ browserTtl: 60, edgeTtl: 300 });

    expect(rule).toMatchObject({
      action_parameters: {
        browser_ttl: { default: 60, mode: "override_origin" },
        cache: true,
        edge_ttl: { default: 300, mode: "override_origin" },
      },
    });
  });

  it("sets a cache key only for the options switched on", async () => {
    const [sorted] = await sentRules({ sortQueryString: true });
    const [armored] = await sentRules({ cacheDeceptionArmor: true });
    const [plain] = await sentRules({});

    expect(sorted).toMatchObject({ action_parameters: { cache_key: { ignore_query_strings_order: true } } });
    expect(armored).toMatchObject({ action_parameters: { cache_key: { cache_deception_armor: true } } });
    expect(plain).toMatchObject({ action_parameters: { cache: true } });
    expect(JSON.stringify(plain)).not.toContain("cache_key");
  });
});
