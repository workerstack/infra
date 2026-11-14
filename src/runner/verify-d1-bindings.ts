import type { CfClient } from "../api/client.ts";
import { checkD1Exists } from "../provision/check-d1-exists.ts";
import { getD1Detail } from "../provision/d1-read-replicas.ts";
import type { EnvBindings } from "../schema/bindings.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import type { BindingVerification } from "./binding-verification.ts";

/** Checks each declared D1 database exists and, when it does, reads its read-replication mode. */
export async function verifyD1Bindings(
  client: CfClient,
  accountId: string,
  envBindings: EnvBindings,
): Promise<BindingVerification[]> {
  const verified: BindingVerification[] = [];

  await runInOrder(Object.entries(envBindings.d1_databases ?? {}), async ([binding, config]) => {
    const name = config.database_name;

    if (name === undefined || name === "") return;

    const check = await checkD1Exists(client, accountId, name);

    const detail =
      check.exists && check.uuid !== undefined ? await getD1Detail(client, accountId, check.uuid) : undefined;

    verified.push({ binding, exists: check.exists, name, readReplicas: detail?.read_replication.mode, type: "D1" });
  });

  return verified;
}
