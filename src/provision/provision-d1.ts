import type { CfClient } from "../api/client.ts";
import type { EnvBindings } from "../schema/bindings.ts";
import { isPlaceholder } from "../shared/is-placeholder.ts";
import { STUB } from "../shared/stub.constants.ts";
import type { ConfigEdit } from "./config-edit.ts";
import { enableD1ReadReplicas, getD1Detail } from "./d1-read-replicas.ts";
import { escapePattern } from "./escape-pattern.ts";
import { findOrCreateD1 } from "./find-or-create-d1.ts";
import type { ProvisionContext } from "./provision-context.ts";
import { READ_REPLICATION_AUTO } from "./read-replication-auto.constants.ts";

type D1Binding = NonNullable<EnvBindings["d1_databases"]>[string];

async function ensureReplicas(client: CfClient, ctx: ProvisionContext, databaseId: string): Promise<void> {
  const detail = await getD1Detail(client, ctx.accountId, databaseId);

  if (detail === undefined) return;

  const mode = detail.read_replication.mode;

  if (mode === READ_REPLICATION_AUTO) {
    ctx.log(`    read replicas: ${mode}`);

    return;
  }

  ctx.log("    read replicas: enabling ...");

  try {
    await enableD1ReadReplicas(client, ctx.accountId, databaseId);
    ctx.log("    → enabled");
  } catch (error) {
    ctx.log(`    → failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** Finds or creates one D1 database, anchoring the id edit on its globally unique name; turns replicas on. */
export async function provisionD1(client: CfClient, ctx: ProvisionContext, binding: D1Binding): Promise<ConfigEdit[]> {
  const name = binding.database_name;

  if (name === undefined || name === "") return [];

  ctx.log(`  [${ctx.env}] D1 "${name}" ...`);

  const { uuid } = await findOrCreateD1(client, ctx.accountId, name);

  ctx.log(`    → ${uuid}`);
  await ensureReplicas(client, ctx, uuid);

  if (!isPlaceholder(binding.database_id)) return [];

  const pattern = new RegExp(`database_id: "${STUB}",(\\s+)database_name: "${escapePattern(name)}"`);

  return [{ pattern, replacement: `database_id: "${uuid}",$1database_name: "${name}"` }];
}
