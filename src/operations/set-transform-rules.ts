import type { CfClient } from "../api/client.ts";
import type { ZoneConfig } from "../schema/zone.ts";
import { RULESET_ACTION } from "./ruleset-action.constants.ts";
import { RULESET_PHASE } from "./ruleset-phase.constants.ts";
import { upsertRuleset } from "./upsert-ruleset.ts";

/**
 * Pushes URL-rewrite rules on `http_request_transform`, which runs before worker route dispatch,
 * so workers see post-rewrite paths. No rules still PUTs `{ rules: [] }` to clear drift.
 */
export async function setTransformRules(client: CfClient, config: ZoneConfig): Promise<void> {
  const rules = config.transforms.urlRewrites.map((rewrite) => ({
    action: RULESET_ACTION.REWRITE,
    action_parameters: { uri: { path: { expression: rewrite.pathExpression } } },
    description: rewrite.description,
    enabled: rewrite.enabled,
    expression: rewrite.expression,
  }));

  await upsertRuleset(client, RULESET_PHASE.TRANSFORM, rules);
}
