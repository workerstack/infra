import type { CfClient } from "../api/client.ts";
import type { EmailRoutingRule } from "../schema/email-routing.ts";
import type { ZoneConfig } from "../schema/zone.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { CATCH_ALL_NAME } from "./catch-all-name.constants.ts";
import type { CfEmailRule, EmailAction, EmailRuleView } from "./email-rules.ts";
import { fromCfAction, liveRuleView, ruleKey, toCfActions, toCfMatchers } from "./email-rules.ts";

export type EmailRoutingVerifyResult = {
  catchAll: EmailAction | null;
  declared: number;
  live: number;
  missing: string[];
};

type EmailRoutingState = { catchAll: EmailAction | null; rules: EmailRuleView[] };

async function listEmailRoutingRules(client: CfClient): Promise<CfEmailRule[]> {
  const result = await client.request<CfEmailRule[]>("GET", `/zones/${client.zoneId}/email/routing/rules`);

  return Array.isArray(result) ? result : [];
}

async function getCatchAllRule(client: CfClient): Promise<CfEmailRule | null> {
  try {
    return await client.request<CfEmailRule>("GET", `/zones/${client.zoneId}/email/routing/rules/catch_all`);
  } catch {
    return null;
  }
}

/** The live custom rules and the live catch-all action. */
export async function getEmailRoutingState(client: CfClient): Promise<EmailRoutingState> {
  const [rules, catchAll] = await Promise.all([listEmailRoutingRules(client), getCatchAllRule(client)]);

  return {
    catchAll: catchAll === null ? null : fromCfAction(catchAll.actions),
    rules: rules.flatMap((rule) => liveRuleView(rule) ?? []),
  };
}

async function upsertRule(client: CfClient, rule: EmailRoutingRule, existing: CfEmailRule | undefined): Promise<void> {
  const body = {
    actions: toCfActions(rule.action),
    enabled: rule.enabled,
    matchers: toCfMatchers(rule.match),
    name: rule.name,
  };

  if (existing === undefined) await client.request("POST", `/zones/${client.zoneId}/email/routing/rules`, body);
  else if (existing.enabled !== rule.enabled || existing.name !== rule.name)
    await client.request("PUT", `/zones/${client.zoneId}/email/routing/rules/${existing.id}`, body);
}

/**
 * Upserts declared custom rules. Never deletes live rules that are not in config:
 * those are human inboxes (contact@, sales@) and must stay.
 *
 * CF matchers are an exact `to` or catch-all. There is no glob.
 */
export async function setEmailRouting(client: CfClient, config: ZoneConfig): Promise<void> {
  const liveByKey = new Map<string, CfEmailRule>();

  for (const rule of await listEmailRoutingRules(client)) {
    const view = liveRuleView(rule);

    if (view !== null) liveByKey.set(ruleKey(view), rule);
  }

  await runInOrder(config.emailRouting.rules, (rule) => upsertRule(client, rule, liveByKey.get(ruleKey(rule))));

  const { catchAll } = config.emailRouting;

  if (catchAll !== undefined) {
    await client.request("PUT", `/zones/${client.zoneId}/email/routing/rules/catch_all`, {
      actions: toCfActions(catchAll),
      enabled: true,
      matchers: [{ type: "all" }],
      name: CATCH_ALL_NAME,
    });
  }
}

/** Reports the declared custom rules that are missing from the live zone. */
export async function verifyEmailRouting(client: CfClient, config: ZoneConfig): Promise<EmailRoutingVerifyResult> {
  const state = await getEmailRoutingState(client);
  const liveKeys = new Set(state.rules.map((rule) => ruleKey(rule)));
  const { rules } = config.emailRouting;

  return {
    catchAll: state.catchAll,
    declared: rules.length,
    live: state.rules.length,
    missing: rules.filter((rule) => !liveKeys.has(ruleKey(rule))).map((rule) => rule.name),
  };
}
