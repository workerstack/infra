import { requiredGlobal } from "../credentials.ts";
import type { InfraEnv } from "../schema/infra.ts";
import type { CfFetch } from "./cf-fetch.ts";
import { cfRequest } from "./cf-request.ts";
import type { CfBody } from "./cf-request.ts";

export type AiSearchInstanceResult = {
  embedding_model: string;
  modified_on: string;
  name: string;
  status: string;
};

export type AiSearchCreateBody = {
  chunk_overlap?: number;
  chunk_size?: number;
  data_source: { source: string; type: "r2" | "web-crawler" };
  embedding_model: string;
  generation_model?: string;
  hybrid_search?: boolean;
  match_threshold?: number;
  max_num_results?: number;
  name: string;
  reranking?: boolean;
  reranking_model?: string;
};

/** The call's target: the env holding `CLOUDFLARE_API_TOKEN`, the account, and the `fetch` to use. */
export type AiSearchTarget = { accountId: string; env: InfraEnv; fetcher?: CfFetch };

function instancesPath(accountId: string): string {
  return `/accounts/${accountId}/ai-search/namespaces/default/instances`;
}

function instancePath(accountId: string, name: string): string {
  return `${instancesPath(accountId)}/${encodeURIComponent(name)}`;
}

type AiSearchCall = { body?: CfBody; method: string; path: string };

// AI Search endpoints only accept Bearer tokens: X-Auth-Key / X-Auth-Email are rejected.
async function request<T>(target: AiSearchTarget, call: AiSearchCall): Promise<T> {
  const headers = {
    Authorization: `Bearer ${requiredGlobal(target.env, "CLOUDFLARE_API_TOKEN")}`,
    "Content-Type": "application/json",
  };

  return await cfRequest<T>({ ...call, headers, label: "CF AI Search API" }, target.fetcher ?? fetch);
}

/** Lists all AI Search instances for the account. */
export function listAiSearchInstances(target: AiSearchTarget): Promise<AiSearchInstanceResult[]> {
  return request(target, { method: "GET", path: instancesPath(target.accountId) });
}

/** Gets one AI Search instance by name, or undefined when the request fails (not found). */
export async function getAiSearchInstance(
  target: AiSearchTarget,
  name: string,
): Promise<AiSearchInstanceResult | undefined> {
  try {
    return await request(target, { method: "GET", path: instancePath(target.accountId, name) });
  } catch {
    return undefined;
  }
}

/** Updates an existing AI Search instance (partial update). */
export function updateAiSearchInstance(
  target: AiSearchTarget,
  name: string,
  body: Partial<Omit<AiSearchCreateBody, "name">>,
): Promise<AiSearchInstanceResult> {
  return request(target, { body, method: "PATCH", path: instancePath(target.accountId, name) });
}

/** Deletes an AI Search instance. */
export async function deleteAiSearchInstance(target: AiSearchTarget, name: string): Promise<void> {
  await request(target, { method: "DELETE", path: instancePath(target.accountId, name) });
}

/** Triggers a re-index or re-crawl of the instance's data source. */
export async function syncAiSearchInstance(target: AiSearchTarget, name: string): Promise<void> {
  await request(target, { method: "POST", path: `${instancePath(target.accountId, name)}/jobs` });
}
