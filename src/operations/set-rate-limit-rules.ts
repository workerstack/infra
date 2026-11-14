import type { CfClient } from "../api/client.ts";
import type { ZoneConfig } from "../schema/zone.ts";
import { RULESET_ACTION } from "./ruleset-action.constants.ts";
import { RULESET_PHASE } from "./ruleset-phase.constants.ts";
import { upsertRuleset } from "./upsert-ruleset.ts";

/** The counters a rate limit keys on. */
const CHARACTERISTICS = ["cf.colo.id", "ip.src"];

/** Writes the rate-limit phase from the config; nothing when the config has no rules. */
export async function setRateLimitRules(client: CfClient, config: ZoneConfig): Promise<void> {
  if (config.rateLimit.length === 0) return;

  const rules = config.rateLimit.map((rule) => ({
    action: RULESET_ACTION.BLOCK,
    description: rule.description,
    enabled: rule.enabled,
    expression: rule.expression,
    ratelimit: {
      characteristics: CHARACTERISTICS,
      mitigation_timeout: rule.mitigationTimeout,
      period: rule.period,
      requests_per_period: rule.requestsPerPeriod,
    },
  }));

  await upsertRuleset(client, RULESET_PHASE.RATELIMIT, rules);
}
