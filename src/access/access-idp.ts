import type { CfClient } from "../api/client.ts";
import { requiredScoped } from "../credentials.ts";
import type { CloudflareAccessGoogleIdP } from "../schema/cloudflare-env.ts";
import type { InfraEnv, InfraScope } from "../schema/infra.ts";
import { ACCESS_GOOGLE_SECRET_KEY } from "./access-google-secret-key.constants.ts";
import { accessList } from "./access-list.ts";
import type { CfAccessIdP } from "./cf-access-types.ts";

/** The IdP to sync: its config, and the env and scope holding `ACCESS_GOOGLE_CLIENT_SECRET`. */
export type GoogleIdPTarget = {
  config: CloudflareAccessGoogleIdP;
  env: InfraEnv;
  scope: InfraScope;
};

function idpPath(accountId: string): string {
  return `/accounts/${accountId}/access/identity_providers`;
}

function idpName(scope: InfraScope): string {
  return `Google (${scope})`;
}

/**
 * Find-or-create the per-scope Google IdP.
 * Match by `name` (deterministic: `Google (${scope})`).
 * If found, PUT to sync credentials (drift).
 */
export async function findOrCreateGoogleIdP(
  client: CfClient,
  accountId: string,
  target: GoogleIdPTarget,
): Promise<CfAccessIdP> {
  const { config, env, scope } = target;

  const name = idpName(scope);

  const body = {
    config: {
      client_id: config.clientId,
      client_secret: requiredScoped(env, scope, ACCESS_GOOGLE_SECRET_KEY),
    },
    name,
    type: "google",
  };

  const list = await accessList<CfAccessIdP>(client, idpPath(accountId));
  const existing = list.find((idp) => idp.name === name);

  if (existing !== undefined) return client.request<CfAccessIdP>("PUT", `${idpPath(accountId)}/${existing.id}`, body);

  return client.request<CfAccessIdP>("POST", idpPath(accountId), body);
}

/** Find the per-scope Google IdP by name (`Google (${scope})`). Returns undefined if missing. */
export async function getGoogleIdP(
  client: CfClient,
  accountId: string,
  scope: InfraScope,
): Promise<CfAccessIdP | undefined> {
  try {
    const list = await accessList<CfAccessIdP>(client, idpPath(accountId));

    return list.find((idp) => idp.name === idpName(scope));
  } catch {
    return undefined;
  }
}
