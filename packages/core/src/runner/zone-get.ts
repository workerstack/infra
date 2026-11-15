import type { AiSearchTarget } from "../api/ai-search.ts";
import type { CfClient } from "../api/client.ts";
import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { CloudflareTarget } from "./cloudflare-target.ts";
import { reportAiSearch } from "./report-ai-search.ts";
import { reportDeclaredBindings } from "./report-declared-bindings.ts";
import { reportZoneDrift } from "./report-zone-drift.ts";
import { reportZoneR2 } from "./report-zone-r2.ts";
import { reportZoneRules } from "./report-zone-rules.ts";
import { reportZoneTurnstile } from "./report-zone-turnstile.ts";
import { verifyAiSearchInstances } from "./verify-ai-search-instances.ts";
import { verifyR2Config } from "./verify-r2-config.ts";
import { verifyTurnstileConfig } from "./verify-turnstile-config.ts";
import { verifyZoneConfig } from "./verify-zone-config.ts";

function aiSearchTarget(target: CloudflareTarget): AiSearchTarget {
  const { accountId, env, fetcher } = target;

  return fetcher === undefined ? { accountId, env } : { accountId, env, fetcher };
}

/** The `infra zone-get` report: zone rules, drift, declared bindings, R2, AI Search and Turnstile. */
export async function zoneGet(client: CfClient, target: CloudflareTarget, log: Log = stdoutLog): Promise<void> {
  const { accountId, config, name } = target;
  const { domain, zoneId } = config.zone;

  log(`\n Zone: ${name} (${domain}) [${zoneId}]`);

  const zone = await verifyZoneConfig(client, config.zone);

  reportZoneRules(zone, log);
  reportZoneDrift(zone, log);

  for (const [bindingEnv, bindings] of Object.entries(config.bindings))
    reportDeclaredBindings(bindingEnv, bindings, log);

  reportZoneR2(await verifyR2Config(client, accountId, config.bindings), log);
  reportAiSearch(await verifyAiSearchInstances(aiSearchTarget(target), config.bindings), log);

  const { turnstile } = config;
  const declared = turnstile !== undefined && Object.keys(turnstile).length > 0;

  reportZoneTurnstile(declared ? await verifyTurnstileConfig(client, accountId, turnstile) : undefined, log);
}
