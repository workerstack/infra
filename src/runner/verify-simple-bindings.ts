import type { CfClient } from "../api/client.ts";
import { checkKVExists } from "../provision/check-kv-exists.ts";
import { checkQueueExists } from "../provision/check-queue-exists.ts";
import type { EnvBindings } from "../schema/bindings.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import type { BindingVerification } from "./binding-verification.ts";

async function verifyKv(client: CfClient, accountId: string, envBindings: EnvBindings): Promise<BindingVerification[]> {
  const verified: BindingVerification[] = [];

  await runInOrder(Object.entries(envBindings.kv_namespaces ?? {}), async ([binding, config]) => {
    const id = config.id;

    if (id === undefined || id === "") return;

    verified.push({ binding, exists: await checkKVExists(client, accountId, id), name: id, type: "KV" });
  });

  return verified;
}

async function verifyQueues(
  client: CfClient,
  accountId: string,
  envBindings: EnvBindings,
): Promise<BindingVerification[]> {
  const verified: BindingVerification[] = [];

  await runInOrder(Object.entries(envBindings.queues ?? {}), async ([binding, config]) => {
    const queue = config.queue;

    if (queue === undefined || queue === "") return;

    verified.push({ binding, exists: await checkQueueExists(client, accountId, queue), name: queue, type: "Queue" });
  });

  return verified;
}

function verifyAnalyticsEngine(envBindings: EnvBindings): BindingVerification[] {
  return Object.entries(envBindings.analytics_engine_datasets ?? {}).flatMap(([binding, config]) =>
    config.dataset === undefined || config.dataset === ""
      ? []
      : [
          {
            binding,
            exists: true,
            name: config.dataset,
            note: "auto-created on first write (not API-verifiable)",
            type: "AE",
          },
        ],
  );
}

/** Checks the KV namespaces and queues exist; Analytics Engine datasets exist implicitly, with a note. */
export async function verifySimpleBindings(
  client: CfClient,
  accountId: string,
  envBindings: EnvBindings,
): Promise<BindingVerification[]> {
  const kv = await verifyKv(client, accountId, envBindings);
  const queues = await verifyQueues(client, accountId, envBindings);

  return [...kv, ...queues, ...verifyAnalyticsEngine(envBindings)];
}
