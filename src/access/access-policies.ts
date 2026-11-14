import type { CfClient } from "../api/client.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { accessList } from "./access-list.ts";
import { ACCESS_POLICIES_SERVICE_ONLY } from "./access-policies-service-only.constants.ts";
import { ACCESS_POLICIES_WITH_EMAILS } from "./access-policies-with-emails.constants.ts";
import type { CfAccessPolicy } from "./cf-access-types.ts";

/** What an app's policies are built from. */
export type AccessPoliciesTarget = {
  allowEmails: string[];
  appId: string;
  googleIdPId: string;
  serviceTokenId: string;
};

function policiesPath(accountId: string, appId: string): string {
  return `/accounts/${accountId}/access/apps/${appId}/policies`;
}

/** List all policies for an Access app. Returns [] if app not found or on any CF error. */
export async function listAccessPolicies(
  client: CfClient,
  accountId: string,
  appId: string,
): Promise<CfAccessPolicy[]> {
  try {
    return await accessList<CfAccessPolicy>(client, policiesPath(accountId, appId));
  } catch {
    return [];
  }
}

/**
 * Delete all existing policies on an app, then create service_auth + optional allow-emails.
 * Returns count of policies created.
 */
export async function reconcileAccessPolicies(
  client: CfClient,
  accountId: string,
  target: AccessPoliciesTarget,
): Promise<number> {
  const { allowEmails, appId, googleIdPId, serviceTokenId } = target;
  const path = policiesPath(accountId, appId);
  const existing = await accessList<CfAccessPolicy>(client, path);

  await runInOrder(existing, async (policy) => {
    await client.request("DELETE", `${path}/${policy.id}`);
  });

  await client.request("POST", path, {
    decision: "service_auth",
    include: [{ service_token: { token_id: serviceTokenId } }],
    name: "infra service auth",
  });

  if (allowEmails.length === 0) return ACCESS_POLICIES_SERVICE_ONLY;

  await client.request("POST", path, {
    decision: "allow",
    include: allowEmails.map((email) => ({ email: { email } })),
    name: "infra allow emails",
    require: [{ login_method: googleIdPId }],
  });

  return ACCESS_POLICIES_WITH_EMAILS;
}
