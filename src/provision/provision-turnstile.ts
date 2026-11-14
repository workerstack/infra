import type { CfClient } from "../api/client.ts";
import type { CloudflareTurnstileEnv } from "../schema/cloudflare-env.ts";
import type { InfraEnv, InfraScope } from "../schema/infra.ts";
import { isPlaceholder } from "../shared/is-placeholder.ts";
import type { Log } from "../shared/log.ts";
import { STUB } from "../shared/stub.constants.ts";
import { findOrCreateTurnstile } from "./find-or-create-turnstile.ts";
import type { Provisioned } from "./provisioned.ts";
import { TURNSTILE_SECRET_KEY } from "./turnstile-secret-key.constants.ts";

/** The widget to sync, its scope, and the env that may already hold its secret. */
export type TurnstileTarget = {
  accountId: string;
  config: CloudflareTurnstileEnv;
  env: InfraEnv;
  scope: InfraScope;
};

/**
 * Finds, creates or updates one Turnstile widget. The site key is a config edit when the config still holds `STUB`;
 * the secret is an env write when the scope has none, and never part of an edit.
 */
export async function provisionTurnstile(client: CfClient, target: TurnstileTarget, log: Log): Promise<Provisioned> {
  const { accountId, config, env, scope } = target;

  log(`  [${scope}] Turnstile "${config.name}" ...`);

  const widget = await findOrCreateTurnstile(client, accountId, config);

  const edits = isPlaceholder(config.siteKey)
    ? [{ pattern: `siteKey: "${STUB}",`, replacement: `siteKey: "${widget.sitekey}",` }]
    : [];

  const secrets = isPlaceholder(env[scope][TURNSTILE_SECRET_KEY])
    ? [{ key: TURNSTILE_SECRET_KEY, scope, value: widget.secret }]
    : [];

  log(`    → sitekey: ${widget.sitekey}`);

  return { edits, secrets };
}
