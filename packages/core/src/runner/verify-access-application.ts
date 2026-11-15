import { getAccessApplication } from "../access/access-apps.ts";
import { listAccessPolicies } from "../access/access-policies.ts";
import type { CfClient } from "../api/client.ts";
import type { AccessApplicationCheck } from "./access-application-check.ts";
import type { AccessApplicationVerification } from "./access-application-verification.ts";
import { accessDrift } from "./access-drift.ts";

/** Reads one Access application with its policies and names the fields that drift from the config. */
export async function verifyAccessApplication(
  client: CfClient,
  accountId: string,
  check: AccessApplicationCheck,
): Promise<AccessApplicationVerification> {
  const { config } = check;
  const app = await getAccessApplication(client, accountId, config.name);

  if (app === undefined) {
    return {
      allowedIdps: [],
      drift: [],
      exists: false,
      name: config.name,
      policies: [],
      selfHostedDomains: [],
      sessionDuration: "",
    };
  }

  const policies = await listAccessPolicies(client, accountId, app.id);

  return {
    allowedIdps: app.allowed_idps,
    drift: accessDrift(app, policies, check),
    exists: true,
    id: app.id,
    name: app.name,
    policies: policies.map((policy) => ({ decision: policy.decision ?? "", id: policy.id, name: policy.name ?? "" })),
    selfHostedDomains: app.self_hosted_domains,
    sessionDuration: app.session_duration,
  };
}
