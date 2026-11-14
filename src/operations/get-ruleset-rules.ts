import type { CfClient } from "../api/client.ts";
import type { CfRuleset } from "./cf-ruleset.ts";
import type { RulesetRule } from "./ruleset-rule.ts";

type CfRulesetDetail = { id: string; rules?: RulesetRule[] };

/** The rules of the zone's ruleset for `phase`; none when the zone has no such ruleset. */
export async function getRulesetRules(client: CfClient, phase: string): Promise<RulesetRule[]> {
  const rulesets = await client.request<CfRuleset[]>("GET", `/zones/${client.zoneId}/rulesets`);
  const existing = rulesets.find((ruleset) => ruleset.phase === phase);

  if (existing === undefined) return [];

  const detail = await client.request<CfRulesetDetail>("GET", `/zones/${client.zoneId}/rulesets/${existing.id}`);

  return detail.rules ?? [];
}
