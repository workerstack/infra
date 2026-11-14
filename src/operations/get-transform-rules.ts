import type { CfClient } from "../api/client.ts";
import { getRulesetRules } from "./get-ruleset-rules.ts";
import { RULESET_PHASE } from "./ruleset-phase.constants.ts";
import type { TransformRule } from "./transform-rule.ts";

/** The live transform rules, with `action_parameters.uri.path.expression` flattened to `pathExpression`. */
export async function getTransformRules(client: CfClient): Promise<TransformRule[]> {
  const rules = await getRulesetRules(client, RULESET_PHASE.TRANSFORM);

  return rules.map((rule) => ({
    description: rule.description,
    enabled: rule.enabled,
    expression: rule.expression ?? "",
    pathExpression: rule.action_parameters?.uri?.path?.expression ?? "",
  }));
}
