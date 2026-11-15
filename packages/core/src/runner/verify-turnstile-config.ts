import type { CfClient } from "../api/client.ts";
import { getTurnstileWidget } from "../provision/get-turnstile-widget.ts";
import type { CloudflareTurnstileEnv } from "../schema/cloudflare-env.ts";
import type { InfraScope } from "../schema/infra.ts";
import { isPlaceholder } from "../shared/is-placeholder.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { scopedEntries } from "../shared/scoped-entries.ts";
import type { TurnstileVerification } from "./turnstile-verification.ts";

/** Reads each scope's widget by its site key; a scope with a placeholder key or no live widget is left out. */
export async function verifyTurnstileConfig(
  client: CfClient,
  accountId: string,
  turnstile: Partial<Record<InfraScope, CloudflareTurnstileEnv>>,
): Promise<TurnstileVerification[]> {
  const results: TurnstileVerification[] = [];

  await runInOrder(scopedEntries(turnstile), async ([scope, config]) => {
    if (isPlaceholder(config.siteKey)) return;

    const widget = await getTurnstileWidget(client, accountId, config.siteKey);

    if (widget === undefined) return;

    results.push({
      clearanceLevel: widget.clearance_level,
      domains: widget.domains,
      env: scope,
      mode: widget.mode,
      name: widget.name,
      sitekey: widget.sitekey,
    });
  });

  return results;
}
