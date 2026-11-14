import type { CfClient } from "../api/client.ts";
import type { EnvBindings } from "../schema/bindings.ts";
import { isPlaceholder } from "../shared/is-placeholder.ts";
import { STUB } from "../shared/stub.constants.ts";
import type { ConfigEdit } from "./config-edit.ts";
import { findOrCreateKV } from "./find-or-create-kv.ts";
import type { ProvisionContext } from "./provision-context.ts";

type KvBinding = NonNullable<EnvBindings["kv_namespaces"]>[string];

// `EXAMPLE_CACHE_KV` in `dev` is titled `example-cache-kv-dev`.
function kvTitle(key: string, env: string): string {
  return `${key.toLowerCase().replaceAll("_", "-")}-${env}`;
}

/** Finds or creates the KV namespace a binding names by its key and env. */
export async function provisionKv(
  client: CfClient,
  ctx: ProvisionContext,
  binding: { key: string; value: KvBinding },
): Promise<ConfigEdit[]> {
  const { key, value } = binding;
  const title = kvTitle(key, ctx.env);

  ctx.log(`  [${ctx.env}] KV "${title}" ...`);

  const { id } = await findOrCreateKV(client, ctx.accountId, title);

  ctx.log(`    → ${id}`);

  if (!isPlaceholder(value.id)) return [];

  return [{ pattern: `${key}: { id: "${STUB}" }`, replacement: `${key}: { id: "${id}" }` }];
}
