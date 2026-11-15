import type { RedirectRule } from "./redirect-rule.ts";
import { RULESET_ACTION } from "./ruleset-action.constants.ts";

/** One redirect rule as the zone is sent it. */
export type RedirectRuleBody = {
  action: string;
  action_parameters: {
    from_value: {
      preserve_query_string: boolean;
      status_code: number;
      target_url: { expression: string };
    };
  };
  description: string;
  enabled: boolean;
  expression: string;
};

/** What the zone is sent for one redirect rule. */
export function redirectRuleBody(rule: RedirectRule): RedirectRuleBody {
  return {
    action: RULESET_ACTION.REDIRECT,
    action_parameters: {
      from_value: {
        preserve_query_string: rule.preserveQueryString,
        status_code: rule.statusCode,
        target_url: { expression: rule.targetExpression },
      },
    },
    description: rule.description,
    enabled: rule.enabled,
    expression: rule.expression,
  };
}
