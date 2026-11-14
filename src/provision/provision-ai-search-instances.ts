import { getAiSearchInstance, syncAiSearchInstance, updateAiSearchInstance } from "../api/ai-search.ts";
import type { AiSearchTarget } from "../api/ai-search.ts";
import type { AiSearchInstanceConfig, EnvBindings } from "../schema/bindings.ts";
import type { InfraEnv } from "../schema/infra.ts";
import type { Log } from "../shared/log.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { wranglerEnv } from "../wrangler-env.ts";
import { createAiSearch } from "./ai-search-create.ts";
import { aiSearchPatch } from "./ai-search-patch.ts";

/** Creates one instance; given by the caller so a test needs no wrangler. */
type AiSearchCreate = (config: AiSearchInstanceConfig) => Promise<void>;

/** What to reconcile: the bindings by env name, the account and env holding `CLOUDFLARE_API_TOKEN`, the repo root. */
export type AiSearchProvision = {
  accountId: string;
  bindings: Record<string, EnvBindings>;
  create?: AiSearchCreate;
  env: InfraEnv;
  fetcher?: AiSearchTarget["fetcher"];
  root: string;
};

type Reconcile = { create: AiSearchCreate; log: Log; target: AiSearchTarget };

async function reconcile(run: Reconcile, config: AiSearchInstanceConfig): Promise<void> {
  const { create, log, target } = run;
  const existing = await getAiSearchInstance(target, config.instanceName);

  if (existing !== undefined) {
    log(`    → exists (${existing.status}), patching ...`);
    await updateAiSearchInstance(target, config.instanceName, aiSearchPatch(config));
    log("    → patched");

    return;
  }

  await create(config);
  log("    → created");

  if (config.indexOnCreate === false) return;

  log("    sync (initial crawl) ...");
  await syncAiSearchInstance(target, config.instanceName);
  log("    → sync triggered");
}

/**
 * Reconciles the AI Search instances each env declares: creates missing ones through wrangler (a login is needed),
 * patches existing ones over REST and never deletes.
 */
export async function provisionAiSearchInstances(provision: AiSearchProvision, log: Log = stdoutLog): Promise<void> {
  const { accountId, bindings, env, fetcher, root } = provision;
  const create = provision.create ?? ((config) => createAiSearch(config, { env: wranglerEnv(env), root }));
  const target: AiSearchTarget = fetcher === undefined ? { accountId, env } : { accountId, env, fetcher };

  const instances = Object.entries(bindings).flatMap(([name, envBindings]) =>
    Object.values(envBindings.ai_search_instances ?? {}).map((config): [string, AiSearchInstanceConfig] => [
      name,
      config,
    ]),
  );

  await runInOrder(instances, async ([name, config]) => {
    log(`  [${name}] AI Search "${config.instanceName}" ...`);
    await reconcile({ create, log, target }, config);
  });
}
