import { expect, it } from "vitest";

import type { EnvBindings } from "../schema/bindings.ts";
import { aiInstance, aiSearchFetch } from "./__fixtures__/ai-search-fetch.ts";
import type { AiSearchLive } from "./__fixtures__/ai-search-fetch.ts";
import { globalEnv } from "./__fixtures__/global-env.ts";
import { verifyAiSearchInstances } from "./verify-ai-search-instances.ts";

const ENV = globalEnv({ CLOUDFLARE_API_TOKEN: "cfut_test" });

function declared(...names: string[]): Record<string, EnvBindings> {
  const instances = names.map((name) => ({
    dataSource: { source: "https://example.com/sitemap.xml", type: "web-crawler" as const },
    embeddingModel: "@cf/baai/bge-base-en-v1.5",
    instanceName: name,
  }));

  const entries = instances.map((instance): [string, EnvBindings] => [
    instance.instanceName.split("-")[1] ?? "dev",
    { ai_search_instances: { SEARCH: instance } },
  ]);

  return Object.fromEntries(entries);
}

async function verify(live: AiSearchLive, ...names: string[]): ReturnType<typeof verifyAiSearchInstances> {
  const { fetcher } = aiSearchFetch(live);

  return await verifyAiSearchInstances({ accountId: "acc", env: ENV, fetcher }, declared(...names));
}

it("verifyAiSearchInstances reports an instance that exists with its status", async () => {
  const results = await verify({ listed: [aiInstance("search-dev")] }, "search-dev");

  expect(results).toStrictEqual([
    {
      embeddingModel: "@cf/baai/bge-base-en-v1.5",
      env: "dev",
      exists: true,
      instanceName: "search-dev",
      status: "active",
    },
  ]);
});

it("verifyAiSearchInstances reports exists false when the instance is declared but not on Cloudflare", async () => {
  const results = await verify({}, "search-dev");

  expect(results[0]?.exists).toBe(false);
  expect(results[0]?.status).toBeUndefined();
});

it("verifyAiSearchInstances returns nothing, with no request or token, when no instance is declared", async () => {
  const { fetcher, urls } = aiSearchFetch();

  const results = await verifyAiSearchInstances(
    { accountId: "acc", env: globalEnv({}), fetcher },
    {
      dev: { d1_databases: { DB: { database_id: "uuid", database_name: "db" } } },
      prod: { ai_search_instances: {} },
    },
  );

  expect(results).toStrictEqual([]);
  expect(urls).toStrictEqual([]);
});

it("verifyAiSearchInstances uses one list call for several instances, with an env label each", async () => {
  const { fetcher, urls } = aiSearchFetch({ listed: [aiInstance("search-dev"), aiInstance("search-prod")] });

  const results = await verifyAiSearchInstances(
    { accountId: "acc", env: ENV, fetcher },
    declared("search-dev", "search-prod"),
  );

  expect(urls).toHaveLength(1);

  expect(results.map((result) => [result.env, result.instanceName, result.exists])).toStrictEqual([
    ["dev", "search-dev", true],
    ["prod", "search-prod", true],
  ]);
});

it("verifyAiSearchInstances falls back to a point get when the list lacks the instance", async () => {
  const { fetcher, urls } = aiSearchFetch({ getable: [aiInstance("search-dev")] });

  const results = await verifyAiSearchInstances({ accountId: "acc", env: ENV, fetcher }, declared("search-dev"));

  expect(urls.at(-1)).toContain("/instances/search-dev");
  expect(results[0]?.exists).toBe(true);
});

it("verifyAiSearchInstances tolerates a failing list and falls back to the point get", async () => {
  const results = await verify({ failList: true, getable: [aiInstance("search-dev")] }, "search-dev");

  expect(results[0]?.exists).toBe(true);
});

it("verifyAiSearchInstances throws the fix line when CLOUDFLARE_API_TOKEN has no global value", async () => {
  const { fetcher } = aiSearchFetch();

  const target = { accountId: "acc", env: globalEnv({}), fetcher };
  const fix = "CLOUDFLARE_API_TOKEN has no global value; run bun repo env set CLOUDFLARE_API_TOKEN --scope global";

  await expect(verifyAiSearchInstances(target, declared("search-dev"))).rejects.toThrow(fix);
});
