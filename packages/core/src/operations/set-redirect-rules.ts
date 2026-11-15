import type { CfClient } from "../api/client.ts";
import type { CfRuleset } from "./cf-ruleset.ts";
import { redirectRuleBody } from "./redirect-rule-body.ts";
import type { RedirectRule } from "./redirect-rule.ts";
import { RULESET_PHASE } from "./ruleset-phase.constants.ts";
import { upsertRuleset } from "./upsert-ruleset.ts";

// Writes the zone's redirect phase as exactly `rules`, in order: every writer sends the whole list, so a rule
// the config no longer names is gone and a second run sends the same body. No rules clears the phase; a zone
// with no phase and no rules is left alone.
/** Writes the zone's redirect phase as exactly `rules`. */
export async function setRedirectRules(client: CfClient, rules: readonly RedirectRule[]): Promise<void> {
  if (rules.length === 0) {
    const rulesets = await client.request<CfRuleset[]>("GET", `/zones/${client.zoneId}/rulesets`);

    if (!rulesets.some(({ phase }) => phase === RULESET_PHASE.DYNAMIC_REDIRECT)) return;
  }

  await upsertRuleset(client, RULESET_PHASE.DYNAMIC_REDIRECT, rules.map(redirectRuleBody));
}
