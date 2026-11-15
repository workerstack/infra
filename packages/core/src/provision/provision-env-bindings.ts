import type { CfClient } from "../api/client.ts";
import type { EnvBindings } from "../schema/bindings.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import type { ConfigEdit } from "./config-edit.ts";
import { findOrCreateQueue } from "./find-or-create-queue.ts";
import type { ProvisionContext } from "./provision-context.ts";
import { provisionD1 } from "./provision-d1.ts";
import { provisionKv } from "./provision-kv.ts";
import { provisionR2 } from "./provision-r2.ts";

function provisionQueues(client: CfClient, ctx: ProvisionContext, bindings: EnvBindings): Promise<void> {
  const queues = Object.values(bindings.queues ?? {}).filter(
    (queue) => queue.queue !== undefined && queue.queue !== "",
  );

  return runInOrder(queues, async ({ queue }) => {
    ctx.log(`  [${ctx.env}] Queue "${queue}" ...`);
    await findOrCreateQueue(client, ctx.accountId, queue ?? "");
    ctx.log("    → exists");
  });
}

function noteAnalytics(ctx: ProvisionContext, bindings: EnvBindings): void {
  const datasets = Object.values(bindings.analytics_engine_datasets ?? {}).map(({ dataset }) => dataset ?? "");

  for (const dataset of datasets.filter((name) => name !== ""))
    ctx.log(`  [${ctx.env}] AE "${dataset}" ... (auto-created on first write)`);
}

/** Provisions one env's D1, KV, R2 and queues, and notes its Analytics Engine datasets; returns the id edits. */
export async function provisionEnvBindings(
  client: CfClient,
  ctx: ProvisionContext,
  bindings: EnvBindings,
): Promise<ConfigEdit[]> {
  const edits: ConfigEdit[] = [];

  await runInOrder(Object.values(bindings.d1_databases ?? {}), async (binding) => {
    edits.push(...(await provisionD1(client, ctx, binding)));
  });

  await runInOrder(Object.entries(bindings.kv_namespaces ?? {}), async ([key, value]) => {
    edits.push(...(await provisionKv(client, ctx, { key, value })));
  });

  await runInOrder(Object.values(bindings.r2_buckets ?? {}), (bucket) => provisionR2(client, ctx, bucket));
  await provisionQueues(client, ctx, bindings);
  noteAnalytics(ctx, bindings);

  return edits;
}
