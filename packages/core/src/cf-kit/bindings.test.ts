import { describe, expect, it } from "vitest";

import { fakeInfraEnv } from "../shared/__fixtures__/fake-infra-env.ts";
import { fixtureConfig } from "./__fixtures__/kit-fixtures.ts";
import type { CfKit } from "./cf-kit.ts";
import { createCfKit } from "./create-cf-kit.ts";

const kit = createCfKit({
  config: fixtureConfig(),
  localRemote: ["d1_databases", "r2_buckets"],
  ratelimitIds: "ratelimit-ids.json",
});

describe("storage bindings", () => {
  it("resolve each name against the scope's infra bindings", () => {
    expect(kit.d1("dev", "MAIN_DB")).toStrictEqual({ MAIN_DB: { id: "core-dev-id", name: "core-dev", type: "d1" } });
    expect(kit.kv("prod", "CACHE_KV")).toStrictEqual({ CACHE_KV: { id: "kv-prod", type: "kv" } });
    expect(kit.r2("prod", "CDN")).toStrictEqual({ CDN: { name: "cdn-prod", type: "r2" } });
  });

  it("resolve analytics and AI Search", () => {
    expect(kit.analytics("dev", "EVENTS")).toStrictEqual({
      EVENTS: { name: "events-dev", type: "analytics-engine-dataset" },
    });
    expect(kit.aiSearch("dev", "DOCS")).toStrictEqual({ DOCS: { name: "docs-dev", type: "ai-search" } });
  });
});

describe("remote storage", () => {
  it("is read remotely in local for the kinds the kit owns, and only there", () => {
    expect(kit.d1("local", "MAIN_DB").MAIN_DB).toMatchObject({ dev: { remote: true } });
    expect(kit.r2("local", "CDN").CDN).toMatchObject({ dev: { remote: true } });
    expect(kit.d1("dev", "MAIN_DB").MAIN_DB).not.toHaveProperty("dev");
    expect(kit.kv("local", "CACHE_KV").CACHE_KV).not.toHaveProperty("dev");
  });

  it("is left alone when the kit owns no kind", () => {
    const free = createCfKit({ config: fixtureConfig(), ratelimitIds: "r.json" });

    expect(free.d1("local", "MAIN_DB").MAIN_DB).not.toHaveProperty("dev");
  });
});

describe("missing bindings", () => {
  it("name the scope, kind and binding when infra has none", () => {
    expect(() => kit.aiSearch("local", "DOCS")).toThrow("infra has no local ai_search binding DOCS");
  });

  it("name the lack of a cloudflare block", () => {
    const bare: CfKit = createCfKit({ config: { env: fakeInfraEnv() }, ratelimitIds: "r.json" });

    expect(() => bare.kv("local", "CACHE_KV")).toThrow("infra has no local kv_namespaces binding");
  });
});

describe("queues", () => {
  it("map producers and consumers to the scope's queue names, dead letter queue included", () => {
    expect(kit.queue("prod", "QUEUE")).toStrictEqual({ QUEUE: { name: "q-prod", type: "queue" } });
    expect(kit.queueConsumers("prod", [{ deadLetterQueue: "QUEUE_DLQ", maxRetries: 6, queue: "QUEUE" }])).toStrictEqual(
      [{ deadLetterQueue: "dlq-prod", maxRetries: 6, name: "q-prod", type: "queue" }],
    );
  });
});
