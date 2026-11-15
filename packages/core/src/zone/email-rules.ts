import type { EmailRoutingAction, EmailRoutingRule } from "../schema/email-routing.ts";

export type EmailAction = EmailRoutingAction;

export type EmailMatch = EmailRoutingRule["match"];

type CfEmailAction = { type: "drop" | "forward" | "worker"; value?: string[] };

type CfEmailMatcher = { field?: "to"; type: "all" | "literal"; value?: string };

/** An Email Routing rule as the Cloudflare API lists it. */
export type CfEmailRule = {
  actions: CfEmailAction[];
  enabled: boolean;
  id: string;
  matchers: CfEmailMatcher[];
  name?: string;
  priority?: number;
};

/** A rule reduced to what identifies it: its matcher and its action. */
export type EmailRuleView = { action: EmailAction; match: EmailMatch };

export function toCfActions(action: EmailAction): CfEmailAction[] {
  if (action.type === "drop") return [{ type: "drop" }];

  if (action.type === "forward") return [{ type: "forward", value: [action.to] }];

  return [{ type: "worker", value: [action.worker] }];
}

export function toCfMatchers(match: EmailMatch): CfEmailMatcher[] {
  if (match.type === "all") return [{ type: "all" }];

  return [{ field: "to", type: "literal", value: match.to }];
}

export function fromCfAction(actions: CfEmailAction[] | undefined): EmailAction | null {
  const first = actions?.[0];

  if (first === undefined) return null;

  if (first.type === "drop") return { type: "drop" };

  const value = first.value?.[0];

  if (value === undefined || value === "") return null;

  if (first.type === "forward") return { to: value, type: "forward" };

  return { type: "worker", worker: value };
}

export function fromCfMatch(matchers: CfEmailMatcher[]): EmailMatch | null {
  const first = matchers[0];

  if (first === undefined) return null;

  if (first.type === "all") return { type: "all" };

  return first.value === undefined || first.value === "" ? null : { to: first.value, type: "literal" };
}

/** A stable key for a rule: `to:a@x|forward:b@y`, `all|drop`, `all|worker:w`. */
export function ruleKey(rule: EmailRuleView): string {
  const match = rule.match.type === "all" ? "all" : `to:${rule.match.to}`;

  if (rule.action.type === "drop") return `${match}|drop`;

  if (rule.action.type === "forward") return `${match}|forward:${rule.action.to}`;

  return `${match}|worker:${rule.action.worker}`;
}

/** The matcher and action of a live rule, or null when it has a shape infra does not manage. */
export function liveRuleView(rule: CfEmailRule): EmailRuleView | null {
  const action = fromCfAction(rule.actions);
  const match = fromCfMatch(rule.matchers);

  return action === null || match === null ? null : { action, match };
}
