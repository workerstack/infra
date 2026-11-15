import { findOrCreateAccessApplication } from "../access/access-apps.ts";
import { findOrCreateGoogleIdP } from "../access/access-idp.ts";
import { findOrCreateAccessOrganization } from "../access/access-organization.ts";
import { reconcileAccessPolicies } from "../access/access-policies.ts";
import { ACCESS_SERVICE_TOKEN_SECRET_KEY } from "../access/access-service-token-secret-key.constants.ts";
import { findOrCreateAccessServiceToken } from "../access/access-service-token.ts";
import type { CfClient } from "../api/client.ts";
import type { CloudflareAccessEnv } from "../schema/cloudflare-env.ts";
import type { InfraEnv, InfraScope } from "../schema/infra.ts";
import type { Log } from "../shared/log.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { STUB } from "../shared/stub.constants.ts";
import { escapePattern } from "./escape-pattern.ts";
import type { Provisioned } from "./provisioned.ts";

/** One scope's Access config, and the env holding its secrets. */
export type AccessScopeTarget = {
  accountId: string;
  config: CloudflareAccessEnv;
  env: InfraEnv;
  scope: InfraScope;
};

type Synced = AccessScopeTarget & { googleIdPId: string; serviceTokenId: string };

function syncApplications(client: CfClient, synced: Synced, log: Log): Promise<void> {
  const { accountId, config, googleIdPId, scope, serviceTokenId } = synced;

  return runInOrder(Object.values(config.applications ?? {}), async (app) => {
    log(`  [${scope}] Access application "${app.name}" ...`);

    const cfApp = await findOrCreateAccessApplication(client, accountId, { config: app, googleIdPId });

    log(`    → ${cfApp.id}`);

    const count = await reconcileAccessPolicies(client, accountId, {
      allowEmails: app.allowEmails,
      appId: cfApp.id,
      googleIdPId,
      serviceTokenId,
    });

    log(`    policies: ${count} reconciled`);
  });
}

/**
 * Provisions one scope's organization, Google IdP, service token, applications and policies.
 * A new token's `client_id` is a config edit; its `client_secret` is an env write, never part of an edit.
 */
export async function provisionAccessScope(
  client: CfClient,
  target: AccessScopeTarget,
  log: Log,
): Promise<Provisioned> {
  const { accountId, config, env, scope } = target;
  const { serviceToken } = config;
  const result: Provisioned = { edits: [], secrets: [] };

  log(`  [${scope}] Access organization ...`);

  const org = await findOrCreateAccessOrganization(client, accountId);

  log(`    → team domain: ${org.auth_domain}`);

  log(`  [${scope}] Access IdP "Google (${scope})" ...`);

  const idp = await findOrCreateGoogleIdP(client, accountId, { config: config.google, env, scope });

  log(`    → ${idp.id}`);
  log(`  [${scope}] Access service token "${serviceToken.name}" ...`);

  const token = await findOrCreateAccessServiceToken(client, accountId, { config: serviceToken, env, scope });

  if (token.client_secret === undefined) {
    log(`    → exists: ${token.client_id}`);
  } else {
    log("    → created (secret captured for the env)");

    const pattern = new RegExp(`name: "${escapePattern(serviceToken.name)}",([\\s\\S]*?)clientId: "${STUB}"`);

    result.edits.push({ pattern, replacement: `name: "${serviceToken.name}",$1clientId: "${token.client_id}"` });
    result.secrets.push({ key: ACCESS_SERVICE_TOKEN_SECRET_KEY, scope, value: token.client_secret });
  }

  await syncApplications(client, { ...target, googleIdPId: idp.id, serviceTokenId: token.id }, log);

  return result;
}
