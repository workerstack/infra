import type { CfClient } from "../api/client.ts";
import type { EnvBindings } from "../schema/bindings.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import type { BindingEnvVerification } from "./binding-env-verification.ts";
import { verifyD1Bindings } from "./verify-d1-bindings.ts";
import { verifySimpleBindings } from "./verify-simple-bindings.ts";

/** Verifies each env's D1, KV, Queue and Analytics Engine bindings; an env with none is left out. */
export async function verifyBindings(
  client: CfClient,
  accountId: string,
  bindings: Record<string, EnvBindings>,
): Promise<BindingEnvVerification[]> {
  const results: BindingEnvVerification[] = [];

  await runInOrder(Object.entries(bindings), async ([env, envBindings]) => {
    const d1 = await verifyD1Bindings(client, accountId, envBindings);
    const simple = await verifySimpleBindings(client, accountId, envBindings);
    const verified = [...d1, ...simple];

    if (verified.length > 0) results.push({ bindings: verified, env });
  });

  return results;
}
