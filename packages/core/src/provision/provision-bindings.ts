import type { CfClient } from "../api/client.ts";
import type { EnvBindings } from "../schema/bindings.ts";
import type { CloudflareTurnstileEnv } from "../schema/cloudflare-env.ts";
import type { InfraEnv, InfraScope } from "../schema/infra.ts";
import type { Log } from "../shared/log.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { scopedEntries } from "../shared/scoped-entries.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { provisionEnvBindings } from "./provision-env-bindings.ts";
import { provisionTurnstile } from "./provision-turnstile.ts";
import type { Provisioned } from "./provisioned.ts";

/** What to provision: the bindings by env name, the Turnstile widgets by scope, and the env holding their secrets. */
export type BindingsTarget = {
  accountId: string;
  bindings: Record<string, EnvBindings>;
  env: InfraEnv;
  turnstile?: Partial<Record<InfraScope, CloudflareTurnstileEnv>> | undefined;
  zoneId: string;
};

/**
 * Provisions every env's bindings, then the Turnstile widgets. Returns config edits for ids and the secrets to write.
 * Progress lines go to `log`.
 */
export async function provisionBindings(
  client: CfClient,
  target: BindingsTarget,
  log: Log = stdoutLog,
): Promise<Provisioned> {
  const { accountId, bindings, env, turnstile, zoneId } = target;
  const result: Provisioned = { edits: [], secrets: [] };

  await runInOrder(Object.entries(bindings), async ([name, envBindings]) => {
    const ctx = { accountId, env: name, log, zoneId };

    result.edits.push(...(await provisionEnvBindings(client, ctx, envBindings)));
  });

  await runInOrder(
    scopedEntries(turnstile).filter(([, config]) => config.name !== ""),
    async ([scope, config]) => {
      const widget = await provisionTurnstile(client, { accountId, config, env, scope }, log);

      result.edits.push(...widget.edits);
      result.secrets.push(...widget.secrets);
    },
  );

  return result;
}
