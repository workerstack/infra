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
  | {
      /** Discards the mail. */
      type: "drop";
    }
  | {
      /** The verified address to forward to. */
      to: string;
      /** Forwards the mail to an address. */
      type: "forward";
    }
  | {
      /** Hands the mail to a Worker. */
      type: "worker";
      /** The name of the Worker that receives the mail. */
      worker: string;
    };

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
  /** What happens to the mail the rule matches. */
  action: EmailRoutingAction;
  /** Whether the rule is active. Defaults to true. */
  enabled?: boolean | undefined;
  /** Which recipient the rule matches. */
  match:
    | {
        /** Matches every recipient. */
        type: "all";
      }
    | {
        /** The exact address to match. */
        to: string;
        /** Matches one exact address. */
        type: "literal";
      };
  /** The rule's name in the Cloudflare dashboard. */
  name: string;
};

/** One custom-address Email Routing rule: a matcher and the action it takes. */
export type EmailRoutingRule = {
  /** What happens to the mail the rule matches. */
  action: EmailRoutingAction;
  /** Whether the rule is active. */
  enabled: boolean;
  /** Which recipient the rule matches. */
  match:
    | {
        /** Matches every recipient. */
        type: "all";
      }
    | {
        /** The exact address to match. */
        to: string;
        /** Matches one exact address. */
        type: "literal";
      };
  /** The rule's name in the Cloudflare dashboard. */
  name: string;
};

/** Email Routing for the zone: the catch-all action and the custom-address rules. */
export type EmailRoutingConfigInput = {
  /** Omit to leave the live catch-all untouched. */
  catchAll?: EmailRoutingAction | undefined;
  /** Custom addresses. Undeclared live rules are never deleted. */
  rules?: EmailRoutingRuleInput[] | undefined;
};

/** `EmailRoutingConfigInput` once parsed: `rules` is always set. */
export type EmailRoutingConfig = {
  /** Omit to leave the live catch-all untouched. */
  catchAll?: EmailRoutingAction | undefined;
  /** Custom addresses. Undeclared live rules are never deleted. */
  rules: EmailRoutingRule[];
};
