import type { CfClient } from "../api/client.ts";
import type { CloudflareAccessEnv } from "../schema/cloudflare-env.ts";
import type { InfraEnv, InfraScope } from "../schema/infra.ts";
import type { Log } from "../shared/log.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { scopedEntries } from "../shared/scoped-entries.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { provisionAccessScope } from "./provision-access-scope.ts";
import type { Provisioned } from "./provisioned.ts";

/** What to provision: Access config by scope, and the env holding each scope's secrets. */
export type AccessTarget = {
  access: Partial<Record<InfraScope, CloudflareAccessEnv>>;
  accountId: string;
  env: InfraEnv;
};

/** Provisions Cloudflare Access (organization, IdP, service token, apps, policies) for each scope with config. */
export async function provisionAccess(
  client: CfClient,
  target: AccessTarget,
  log: Log = stdoutLog,
): Promise<Provisioned> {
  const { access, accountId, env } = target;
  const result: Provisioned = { edits: [], secrets: [] };

  await runInOrder(scopedEntries(access), async ([scope, config]) => {
    const scoped = await provisionAccessScope(client, { accountId, config, env, scope }, log);

    result.edits.push(...scoped.edits);
    result.secrets.push(...scoped.secrets);
  });

  return result;
}
