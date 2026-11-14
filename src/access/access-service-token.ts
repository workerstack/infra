import type { CfClient } from "../api/client.ts";
import type { CloudflareAccessServiceToken } from "../schema/cloudflare-env.ts";
import type { InfraEnv, InfraScope } from "../schema/infra.ts";
import { isPlaceholder } from "../shared/is-placeholder.ts";
import { accessList } from "./access-list.ts";
import { ACCESS_SERVICE_TOKEN_DURATION } from "./access-service-token-duration.constants.ts";
import { ACCESS_SERVICE_TOKEN_SECRET_KEY } from "./access-service-token-secret-key.constants.ts";
import type { CfAccessServiceTokenResult } from "./cf-access-types.ts";

/** The token to find or create: its config, and the env and scope holding its client secret. */
export type AccessServiceTokenTarget = {
  config: CloudflareAccessServiceToken;
  env: InfraEnv;
  scope: InfraScope;
};

function tokensPath(accountId: string): string {
  return `/accounts/${accountId}/access/service_tokens`;
}

function rotateError(name: string, scope: InfraScope): Error {
  return new Error(
    `Service token "${name}" already exists on CF but ${ACCESS_SERVICE_TOKEN_SECRET_KEY} has no ${scope} value.\n` +
      `CF does not expose service token secrets after creation.\n` +
      `To rotate: 1) delete "${name}" in CF dashboard → Zero Trust → Access → Service Auth\n` +
      `          2) keep clientId as "STUB" in config\n` +
      `          3) re-run the provisioner to create a fresh token and write its secret to the env`,
  );
}

/**
 * Find-or-create the per-scope service token.
 * Match by `config.name`.
 * If found but the config clientId is STUB or the scope has no `ACCESS_SERVICE_TOKEN_CLIENT_SECRET`,
 * throws the rotate error. A freshly created token returns its `client_id` and `client_secret`.
 */
export async function findOrCreateAccessServiceToken(
  client: CfClient,
  accountId: string,
  target: AccessServiceTokenTarget,
): Promise<CfAccessServiceTokenResult> {
  const { config, env, scope } = target;
  const list = await accessList<CfAccessServiceTokenResult>(client, tokensPath(accountId));
  const existing = list.find((token) => token.name === config.name);

  if (existing !== undefined) {
    if (isPlaceholder(config.clientId) || isPlaceholder(env[scope][ACCESS_SERVICE_TOKEN_SECRET_KEY]))
      throw rotateError(config.name, scope);

    return { client_id: existing.client_id, client_secret: undefined, id: existing.id, name: existing.name };
  }

  return client.request<CfAccessServiceTokenResult>("POST", tokensPath(accountId), {
    duration: ACCESS_SERVICE_TOKEN_DURATION,
    name: config.name,
  });
}

/**
 * Find a service token by name. Returns undefined if missing.
 * `client_secret` is always stripped — CF never re-exposes it after creation.
 */
export async function getAccessServiceToken(
  client: CfClient,
  accountId: string,
  name: string,
): Promise<CfAccessServiceTokenResult | undefined> {
  try {
    const list = await accessList<CfAccessServiceTokenResult>(client, tokensPath(accountId));
    const match = list.find((token) => token.name === name);

    if (match === undefined) return undefined;

    return { client_id: match.client_id, client_secret: undefined, id: match.id, name: match.name };
  } catch {
    return undefined;
  }
}
