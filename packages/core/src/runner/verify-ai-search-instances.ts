import { getAiSearchInstance, listAiSearchInstances } from "../api/ai-search.ts";
import type { AiSearchInstanceResult, AiSearchTarget } from "../api/ai-search.ts";
import { requiredGlobal } from "../credentials.ts";
import type { EnvBindings } from "../schema/bindings.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import type { AiSearchVerification } from "./ai-search-verification.ts";

async function listLive(target: AiSearchTarget): Promise<AiSearchInstanceResult[]> {
  try {
    return await listAiSearchInstances(target);
  } catch {
    return [];
  }
}

/**
 * Diffs the declared AI Search instances against the live account, per env name. One list call, then a point get
 * only for names the list lacks, so an account whose instances all exist costs one request. Needs
 * `CLOUDFLARE_API_TOKEN` in `target.env`, and throws its fix line when it is missing and an instance is declared.
 */
export async function verifyAiSearchInstances(
  target: AiSearchTarget,
  bindings: Record<string, EnvBindings>,
): Promise<AiSearchVerification[]> {
  const declared = Object.entries(bindings).flatMap(([env, envBindings]) =>
    Object.values(envBindings.ai_search_instances ?? {}).map((config) => ({ config, env })),
  );

  const results: AiSearchVerification[] = [];

  if (declared.length === 0) return results;

  requiredGlobal(target.env, "CLOUDFLARE_API_TOKEN");

  const live = await listLive(target);

  await runInOrder(declared, async ({ config, env }) => {
    const found =
      live.find((instance) => instance.name === config.instanceName) ??
      (await getAiSearchInstance(target, config.instanceName));

    results.push({
      embeddingModel: config.embeddingModel,
      env,
      exists: found !== undefined,
      instanceName: config.instanceName,
      status: found?.status,
    });
  });

  return results;
}
