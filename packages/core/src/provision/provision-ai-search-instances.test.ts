import { describe, expect, it } from "vitest";

import { okBody } from "../api/__fixtures__/fake-fetch.ts";
import type { Sent } from "../api/__fixtures__/fake-fetch.ts";
import type { AiSearchInstanceConfig, EnvBindings } from "../schema/bindings.ts";
import { fakeInfraEnv } from "../shared/__fixtures__/fake-infra-env.ts";
import { logLines } from "./__fixtures__/log-lines.ts";
import { aiSearchPatch } from "./ai-search-patch.ts";
import { provisionAiSearchInstances } from "./provision-ai-search-instances.ts";

const ENV = fakeInfraEnv({ global: { CLOUDFLARE_API_TOKEN: "tok" } });
const BASE = "https://api.cloudflare.com/client/v4/accounts/acc/ai-search/namespaces/default/instances";
const INSTANCE = { embedding_model: "m", modified_on: "t", name: "example-search-dev", status: "active" };
const MODEL = "@cf/baai/bge-base-en-v1.5";
const MISSING = { errors: [{ message: "not found" }], success: false };

type Setup = { bindings: Record<string, EnvBindings>; existing: boolean };

function config(extra: Partial<AiSearchInstanceConfig> = {}): AiSearchInstanceConfig {
  return {
    dataSource: { source: "https://example.com/sitemap.xml", type: "web-crawler" },
    embeddingModel: MODEL,
    instanceName: "example-search-dev",
    ...extra,
  };
}

function inDev(...configs: AiSearchInstanceConfig[]): EnvBindings {
  return { ai_search_instances: Object.fromEntries(configs.map((one, index) => [`S${index}`, one])) };
}

function setup({ bindings, existing }: Setup) {
  const calls: Sent[] = [];
  const created: AiSearchInstanceConfig[] = [];
  const { lines, log } = logLines();

  function fetcher(url: string, init: RequestInit): Promise<Response> {
    calls.push({ init, url });

    return Promise.resolve(
      new Response(JSON.stringify(!existing && init.method === "GET" ? MISSING : okBody(INSTANCE))),
    );
  }

  function create(made: AiSearchInstanceConfig): Promise<void> {
    created.push(made);

    return Promise.resolve();
  }

  function run(): Promise<void> {
    return provisionAiSearchInstances({ accountId: "acc", bindings, create, env: ENV, fetcher, root: "." }, log);
  }

  return { calls, created, lines, run };
}

describe("provisionAiSearchInstances creating", () => {
  it("creates a missing instance and triggers its first crawl", async () => {
    const { calls, created, lines, run } = setup({ bindings: { dev: inDev(config()) }, existing: false });

    await run();

    expect(created).toStrictEqual([config()]);
    expect(calls.map((call) => `${call.init.method} ${call.url}`)).toStrictEqual([
      `GET ${BASE}/example-search-dev`,
      `POST ${BASE}/example-search-dev/jobs`,
    ]);
    expect(calls[0]?.init.headers).toMatchObject({ Authorization: "Bearer tok" });
    expect(lines).toContain('  [dev] AI Search "example-search-dev" ...');
    expect(lines).toContain("    → created");
  });

  it("does not crawl a new instance when indexOnCreate is false", async () => {
    const { calls, created, run } = setup({
      bindings: { dev: inDev(config({ indexOnCreate: false })) },
      existing: false,
    });

    await run();

    expect(created).toHaveLength(1);
    expect(calls).toHaveLength(1);
  });
});

describe("provisionAiSearchInstances across envs", () => {
  it("reconciles each env on its own", async () => {
    const bindings = {
      dev: { ai_search_instances: { SEARCH: config({ instanceName: "search-dev" }) } },
      prod: { ai_search_instances: { SEARCH: config({ instanceName: "search-prod" }) } },
    };

    const { created, run } = setup({ bindings, existing: false });

    await run();

    expect(created.map((made) => made.instanceName)).toStrictEqual(["search-dev", "search-prod"]);
  });
});

describe("provisionAiSearchInstances existing", () => {
  it("patches an instance without creating or crawling, and never sends the name", async () => {
    const reranking = config({ reranking: true, rerankingModel: "example-reranker" });
    const { calls, created, run } = setup({ bindings: { dev: inDev(reranking) }, existing: true });

    await run();

    const body: unknown = JSON.parse(await new Response(calls[1]?.init.body).text());

    expect(created).toStrictEqual([]);
    expect(calls.map((call) => call.init.method)).toStrictEqual(["GET", "PATCH"]);
    expect(body).toStrictEqual({
      data_source: reranking.dataSource,
      embedding_model: MODEL,
      reranking: true,
      reranking_model: "example-reranker",
    });
  });

  it("skips an env with no instances declared", async () => {
    const bindings = { dev: {}, prod: { ai_search_instances: {} } };
    const { calls, created, run } = setup({ bindings, existing: false });

    await run();

    expect([calls, created]).toStrictEqual([[], []]);
  });
});

describe("aiSearchPatch", () => {
  it("carries every optional setting that is set", () => {
    const all = config({
      chunkOverlap: 1,
      chunkSize: 2,
      generationModel: "gen",
      hybridSearch: true,
      matchThreshold: 0.5,
      maxNumResults: 3,
      reranking: false,
      rerankingModel: "rr",
    });

    expect(aiSearchPatch(all)).toStrictEqual({
      chunk_overlap: 1,
      chunk_size: 2,
      data_source: all.dataSource,
      embedding_model: MODEL,
      generation_model: "gen",
      hybrid_search: true,
      match_threshold: 0.5,
      max_num_results: 3,
      reranking: false,
      reranking_model: "rr",
    });
  });
});
