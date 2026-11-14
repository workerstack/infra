import type { CfClient } from "../api/client.ts";
import type { CfRuleset } from "./cf-ruleset.ts";
import { RULESET_ZONE } from "./ruleset-zone.constants.ts";

/** Writes the zone's ruleset for `phase` as exactly `rules`: a PUT when the phase exists, else a POST. */
export async function upsertRuleset(client: CfClient, phase: string, rules: readonly object[]): Promise<void> {
  const rulesets = await client.request<CfRuleset[]>("GET", `/zones/${client.zoneId}/rulesets`);
  const existing = rulesets.find((ruleset) => ruleset.phase === phase);

  if (existing === undefined) {
    await client.request("POST", `/zones/${client.zoneId}/rulesets`, {
      kind: RULESET_ZONE.KIND,
      name: RULESET_ZONE.NAME,
      phase,
      rules,
    });
  } else {
    await client.request("PUT", `/zones/${client.zoneId}/rulesets/${existing.id}`, { rules });
  }
}
