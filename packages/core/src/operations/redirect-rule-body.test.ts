import { describe, expect, it } from "vitest";

import { redirectRuleBody } from "./redirect-rule-body.ts";

describe("redirectRuleBody", () => {
  it("maps a rule to a redirect action with CF's snake_case keys", () => {
    expect(
      redirectRuleBody({
        description: "d",
        enabled: false,
        expression: "E",
        preserveQueryString: true,
        statusCode: 301,
        targetExpression: "T",
      }),
    ).toStrictEqual({
      action: "redirect",
      action_parameters: {
        from_value: { preserve_query_string: true, status_code: 301, target_url: { expression: "T" } },
      },
      description: "d",
      enabled: false,
      expression: "E",
    });
  });
});
