import type { CfClient } from "../api/client.ts";
import type { ZoneConfig } from "../schema/zone.ts";
import { cacheParametersOf } from "./cache-parameters-of.ts";
import { RULESET_ACTION } from "./ruleset-action.constants.ts";
import { RULESET_PHASE } from "./ruleset-phase.constants.ts";
import { upsertRuleset } from "./upsert-ruleset.ts";

/** Writes the cache phase from the config; nothing when the config has no rules. */
export async function setCacheRules(client: CfClient, config: ZoneConfig): Promise<void> {
  if (config.cache.length === 0) return;

  const rules = config.cache.map((rule) => ({
    action: RULESET_ACTION.SET_CACHE_SETTINGS,
    action_parameters: cacheParametersOf(rule),
    description: rule.description,
    enabled: rule.enabled,
    expression: rule.expression,
  }));

  await upsertRuleset(client, RULESET_PHASE.CACHE, rules);
}
