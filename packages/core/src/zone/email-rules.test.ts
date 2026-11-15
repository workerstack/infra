import { describe, expect, it } from "vitest";

import { fromCfAction, fromCfMatch, liveRuleView, ruleKey, toCfActions, toCfMatchers } from "./email-rules.ts";

describe("email routing mappers", () => {
  it("maps each action to its CF wire shape", () => {
    expect(toCfActions({ type: "drop" })).toStrictEqual([{ type: "drop" }]);
    expect(toCfActions({ to: "team@example.org", type: "forward" })).toStrictEqual([
      { type: "forward", value: ["team@example.org"] },
    ]);
    expect(toCfActions({ type: "worker", worker: "example-prod" })).toStrictEqual([
      { type: "worker", value: ["example-prod"] },
    ]);
  });

  it("maps each matcher to its CF wire shape", () => {
    expect(toCfMatchers({ type: "all" })).toStrictEqual([{ type: "all" }]);
    expect(toCfMatchers({ to: "hello@example.com", type: "literal" })).toStrictEqual([
      { field: "to", type: "literal", value: "hello@example.com" },
    ]);
  });

  it("builds the rule key from the matcher and the action", () => {
    expect(
      ruleKey({
        action: { type: "worker", worker: "example-prod" },
        match: { to: "hello@example.com", type: "literal" },
      }),
    ).toBe("to:hello@example.com|worker:example-prod");
    expect(ruleKey({ action: { type: "drop" }, match: { type: "all" } })).toBe("all|drop");
    expect(ruleKey({ action: { to: "a@example.org", type: "forward" }, match: { type: "all" } })).toBe(
      "all|forward:a@example.org",
    );
  });
});

describe("email routing readers", () => {
  it("reads a CF action back, or null when it has no target", () => {
    expect(fromCfAction([{ type: "drop" }])).toStrictEqual({ type: "drop" });
    expect(fromCfAction([{ type: "forward", value: ["a@example.org"] }])).toStrictEqual({
      to: "a@example.org",
      type: "forward",
    });
    expect(fromCfAction([{ type: "worker", value: ["w"] }])).toStrictEqual({ type: "worker", worker: "w" });
    expect(fromCfAction([{ type: "forward" }])).toBeNull();
    expect(fromCfAction([])).toBeNull();
    expect(fromCfAction(undefined)).toBeNull();
  });

  it("reads a CF matcher back, or null when it has no address", () => {
    expect(fromCfMatch([{ type: "all" }])).toStrictEqual({ type: "all" });
    expect(fromCfMatch([{ field: "to", type: "literal", value: "a@example.com" }])).toStrictEqual({
      to: "a@example.com",
      type: "literal",
    });
    expect(fromCfMatch([{ type: "literal" }])).toBeNull();
    expect(fromCfMatch([])).toBeNull();
  });

  it("gives no view for a rule infra cannot model", () => {
    const rule = { actions: [], enabled: true, id: "i", matchers: [{ type: "all" as const }] };

    expect(liveRuleView(rule)).toBeNull();
    expect(liveRuleView({ ...rule, actions: [{ type: "drop" }] })).toStrictEqual({
      action: { type: "drop" },
      match: { type: "all" },
    });
  });
});
