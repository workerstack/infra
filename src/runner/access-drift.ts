import { ACCESS_SESSION_DEFAULT_HOURS } from "../access/access-session-default-hours.constants.ts";
import type { CfAccessApp, CfAccessPolicy } from "../access/cf-access-types.ts";
import type { CloudflareAccessApplication } from "../schema/cloudflare-env.ts";
import type { AccessApplicationCheck } from "./access-application-check.ts";

function sameSet(left: string[], right: string[]): boolean {
  return JSON.stringify(left.toSorted()) === JSON.stringify(right.toSorted());
}

function policiesDrift(config: CloudflareAccessApplication, policies: CfAccessPolicy[]): boolean {
  const hasEmails = config.allowEmails.length > 0;
  const decisions = new Set(policies.map((policy) => policy.decision ?? ""));
  const hasAllow = hasEmails ? decisions.has("allow") : true;

  return policies.length !== 1 + Number(hasEmails) || !decisions.has("service_auth") || !hasAllow;
}

/** The fields (`paths`, `session`, `allowed_idps`, `policies`) where the live app differs from the config. */
export function accessDrift(app: CfAccessApp, policies: CfAccessPolicy[], check: AccessApplicationCheck): string[] {
  const { config, googleIdPId } = check;
  const expectedDomains = config.paths.map((path) => `${config.domain}${path}`);
  const expectedSession = `${config.sessionDurationHours ?? ACCESS_SESSION_DEFAULT_HOURS}h`;
  const expectedIdps = googleIdPId === undefined ? [] : [googleIdPId];

  return [
    ...(sameSet(app.self_hosted_domains, expectedDomains) ? [] : ["paths"]),
    ...(app.session_duration === expectedSession ? [] : ["session"]),
    ...(sameSet(app.allowed_idps, expectedIdps) ? [] : ["allowed_idps"]),
    ...(policiesDrift(config, policies) ? ["policies"] : []),
  ];
}
