import { describe, expect, it } from "vitest";

import { fakeFetch, okBody } from "./__fixtures__/fake-fetch.ts";
import {
  deleteAiSearchInstance,
  getAiSearchInstance,
  listAiSearchInstances,
  syncAiSearchInstance,
  updateAiSearchInstance,
} from "./ai-search.ts";

const BASE = "https://api.cloudflare.com/client/v4/accounts/acc1/ai-search/namespaces/default/instances";
const env = { dev: {}, global: { CLOUDFLARE_API_TOKEN: "tok" }, local: {}, prod: {} };
const instance = { embedding_model: "m", modified_on: "t", name: "docs search", status: "active" };

describe("AI Search reads", () => {
  it("lists with a Bearer header only", async () => {
    const { calls, fetcher } = fakeFetch(okBody([instance]));
    const result = await listAiSearchInstances({ accountId: "acc1", env, fetcher });

    expect(result).toStrictEqual([instance]);
    expect(calls[0]?.url).toBe(BASE);
    expect(calls[0]?.init.method).toBe("GET");
    expect(calls[0]?.init.headers).toStrictEqual({
      Authorization: "Bearer tok",
      "Content-Type": "application/json",
    });
  });

  it("gets one instance by its encoded name", async () => {
    const { calls, fetcher } = fakeFetch(okBody(instance));

    expect(await getAiSearchInstance({ accountId: "acc1", env, fetcher }, "docs search")).toStrictEqual(instance);
    expect(calls[0]?.url).toBe(`${BASE}/docs%20search`);
  });

  it("gets undefined when the instance is not found", async () => {
    const { fetcher } = fakeFetch({ errors: [{ message: "not found" }], success: false });

    expect(await getAiSearchInstance({ accountId: "acc1", env, fetcher }, "x")).toBeUndefined();
  });
});

describe("AI Search writes", () => {
  it("PATCHes a partial update with a JSON body", async () => {
    const { calls, fetcher } = fakeFetch(okBody(instance));

    await updateAiSearchInstance({ accountId: "acc1", env, fetcher }, "docs", { reranking: true });

    expect(calls[0]?.url).toBe(`${BASE}/docs`);
    expect(calls[0]?.init.method).toBe("PATCH");
    expect(calls[0]?.init.body).toBe('{"reranking":true}');
  });

  it("DELETEs the instance", async () => {
    const { calls, fetcher } = fakeFetch(okBody(null));

    await deleteAiSearchInstance({ accountId: "acc1", env, fetcher }, "docs");

    expect(calls[0]?.url).toBe(`${BASE}/docs`);
    expect(calls[0]?.init.method).toBe("DELETE");
  });

  it("POSTs a sync job", async () => {
    const { calls, fetcher } = fakeFetch(okBody(null));

    await syncAiSearchInstance({ accountId: "acc1", env, fetcher }, "docs");

    expect(calls[0]?.url).toBe(`${BASE}/docs/jobs`);
    expect(calls[0]?.init.method).toBe("POST");
  });
});

describe("AI Search failures", () => {
  it("throws the AI Search error line", async () => {
    const { fetcher } = fakeFetch({ errors: [{ message: "denied" }], success: false });

    await expect(listAiSearchInstances({ accountId: "acc1", env, fetcher })).rejects.toThrow(
      "CF AI Search API GET /accounts/acc1/ai-search/namespaces/default/instances: denied",
    );
  });

  it("throws the fix line before any request when the token is missing", async () => {
    const { calls, fetcher } = fakeFetch(okBody([]));

    await expect(listAiSearchInstances({ accountId: "acc1", env: { ...env, global: {} }, fetcher })).rejects.toThrow(
      "CLOUDFLARE_API_TOKEN has no global value; run bun repo env set CLOUDFLARE_API_TOKEN --scope global",
    );
    expect(calls).toHaveLength(0);
  });
});
