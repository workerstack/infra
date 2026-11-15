import * as z from "zod";

/**
 * Email Routing action. CF Email Routing matchers are exact `to` or catch-all —
 * there is no `oat-*` glob. Unique tester addresses must ride catch-all → Worker
 * (custom addresses like contact@ stay on their own rules).
 */
function emailRoutingActionSchema(): z.ZodType<EmailRoutingAction, EmailRoutingAction> {
  return z.discriminatedUnion("type", [
    z.object({ type: z.literal("drop") }),
    z.object({ to: z.string(), type: z.literal("forward") }),
    z.object({ type: z.literal("worker"), worker: z.string() }),
  ]);
}

/**
 * Email Routing action. CF Email Routing matchers are exact `to` or catch-all —
 * there is no `oat-*` glob. Unique tester addresses must ride catch-all → Worker
 * (custom addresses like contact@ stay on their own rules).
 */
export type EmailRoutingAction =
  | { type: "drop" }
  | { to: string; type: "forward" }
  | { type: "worker"; worker: string };

function emailRoutingRuleSchema(): z.ZodType<EmailRoutingRule, EmailRoutingRuleInput> {
  return z.object({
    action: emailRoutingActionSchema(),
    enabled: z.boolean().default(true),
    match: z.discriminatedUnion("type", [
      z.object({ type: z.literal("all") }),
      z.object({ to: z.string(), type: z.literal("literal") }),
    ]),
    name: z.string(),
  });
}

export function emailRoutingConfigSchema(): z.ZodType<EmailRoutingConfig, EmailRoutingConfigInput> {
  return z.object({
    /** Omit to leave the live catch-all untouched. */
    catchAll: emailRoutingActionSchema().optional(),
    /** Custom addresses. Undeclared live rules are never deleted. */
    rules: z.array(emailRoutingRuleSchema()).default([]),
  });
}

/** One custom-address Email Routing rule: a matcher and the action it takes. */
export type EmailRoutingRuleInput = {
  action: EmailRoutingAction;
  enabled?: boolean | undefined;
  match: { type: "all" } | { to: string; type: "literal" };
  name: string;
};

/** One custom-address Email Routing rule: a matcher and the action it takes. */
export type EmailRoutingRule = {
  action: EmailRoutingAction;
  enabled: boolean;
  match: { type: "all" } | { to: string; type: "literal" };
  name: string;
};

export type EmailRoutingConfigInput = {
  /** Omit to leave the live catch-all untouched. */
  catchAll?: EmailRoutingAction | undefined;
  /** Custom addresses. Undeclared live rules are never deleted. */
  rules?: EmailRoutingRuleInput[] | undefined;
};

export type EmailRoutingConfig = {
  /** Omit to leave the live catch-all untouched. */
  catchAll?: EmailRoutingAction | undefined;
  /** Custom addresses. Undeclared live rules are never deleted. */
  rules: EmailRoutingRule[];
};
