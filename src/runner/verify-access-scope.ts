import { getGoogleIdP } from "../access/access-idp.ts";
import { getAccessOrganization } from "../access/access-organization.ts";
import { getAccessServiceToken } from "../access/access-service-token.ts";
import type { CfAccessIdP } from "../access/cf-access-types.ts";
import type { CfClient } from "../api/client.ts";
import type { CloudflareAccessEnv } from "../schema/cloudflare-env.ts";
import type { InfraScope } from "../schema/infra.ts";
import { STUB } from "../shared/stub.constants.ts";
import type { AccessEnvVerification } from "./access-env-verification.ts";

async function readOrganization(client: CfClient, accountId: string): Promise<AccessEnvVerification["organization"]> {
  const org = await getAccessOrganization(client, accountId);

  return org === undefined ? { exists: false } : { authDomain: org.auth_domain, exists: true };
}

function googleIdpOf(idp: CfAccessIdP | undefined, clientId: string): AccessEnvVerification["googleIdp"] {
  if (idp === undefined) return { clientIdMatches: false, exists: false };

  return { clientIdMatches: idp.config.client_id === clientId, exists: true, id: idp.id };
}

async function readServiceToken(
  client: CfClient,
  accountId: string,
  config: CloudflareAccessEnv,
): Promise<AccessEnvVerification["serviceToken"]> {
  const { clientId, name } = config.serviceToken;
  const token = await getAccessServiceToken(client, accountId, name);
  const hasStub = clientId === STUB;

  if (token === undefined) return { clientIdMatches: false, configHasStub: hasStub, exists: false, name };

  return {
    clientIdMatches: token.client_id === clientId,
    configHasStub: hasStub,
    exists: true,
    id: token.id,
    name: token.name,
  };
}

/** What `verifyAccessScope` read for one scope, before the applications. */
export type AccessScopeState = Pick<AccessEnvVerification, "googleIdp" | "organization" | "serviceToken"> & {
  googleIdPId: string | undefined;
};

/** Reads one scope's Access organization, Google IdP and service token. */
export async function verifyAccessScope(
  client: CfClient,
  accountId: string,
  target: { config: CloudflareAccessEnv; scope: InfraScope },
): Promise<AccessScopeState> {
  const organization = await readOrganization(client, accountId);
  const idp = await getGoogleIdP(client, accountId, target.scope);
  const serviceToken = await readServiceToken(client, accountId, target.config);

  return {
    googleIdPId: idp?.id,
    googleIdp: googleIdpOf(idp, target.config.google.clientId),
    organization,
    serviceToken,
  };
}
