import { describe, expect, it } from "vitest";

import type { CacheRule } from "../schema/cache.ts";
import { cacheParametersOf } from "./cache-parameters-of.ts";

const BASE: CacheRule = {
  bypass: false,
  cacheDeceptionArmor: false,
  description: "example",
  enabled: true,
  expression: "true",
  sortQueryString: false,
};

describe("cacheParametersOf", () => {
  it("is a bypass for a bypass rule, whatever else it sets", () => {
    expect(cacheParametersOf({ ...BASE, bypass: true, edgeTtl: 60 })).toStrictEqual({ cache: false });
  });

  it("caches with only the fields the rule sets", () => {
    expect(cacheParametersOf(BASE)).toStrictEqual({ cache: true });
  });

  it("maps the TTLs and the cache key fields", () => {
    const rule = { ...BASE, browserTtl: 30, cacheDeceptionArmor: true, edgeTtl: 60, sortQueryString: true };

    expect(cacheParametersOf(rule)).toStrictEqual({
      browser_ttl: { default: 30, mode: "override_origin" },
      cache: true,
      cache_key: { cache_deception_armor: true, ignore_query_strings_order: true },
      edge_ttl: { default: 60, mode: "override_origin" },
    });
  });
});
