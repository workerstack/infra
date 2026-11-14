import type { CfClient } from "../api/client.ts";
import type { CloudflareAccessApplication } from "../schema/cloudflare-env.ts";
import { accessList } from "./access-list.ts";
import { ACCESS_SESSION_DEFAULT_HOURS } from "./access-session-default-hours.constants.ts";
import type { CfAccessApp } from "./cf-access-types.ts";

/** The app to sync and the Google IdP it allows. */
export type AccessApplicationTarget = {
  config: CloudflareAccessApplication;
  googleIdPId: string;
};

function appsPath(accountId: string): string {
  return `/accounts/${accountId}/access/apps`;
}

/**
 * Find-or-create an Access application.
 * Match by `config.name`.
 * If found, PUT to sync self_hosted_domains, session_duration, allowed_idps (drift).
 */
export async function findOrCreateAccessApplication(
  client: CfClient,
  accountId: string,
  target: AccessApplicationTarget,
): Promise<CfAccessApp> {
  const { config, googleIdPId } = target;

  const body = {
    allowed_idps: [googleIdPId],
    app_launcher_visible: false,
    name: config.name,
    self_hosted_domains: config.paths.map((path) => `${config.domain}${path}`),
    session_duration: `${config.sessionDurationHours ?? ACCESS_SESSION_DEFAULT_HOURS}h`,
    type: "self_hosted",
  };

  const list = await accessList<CfAccessApp>(client, appsPath(accountId));
  const existing = list.find((app) => app.name === config.name);

  if (existing !== undefined) return client.request<CfAccessApp>("PUT", `${appsPath(accountId)}/${existing.id}`, body);

  return client.request<CfAccessApp>("POST", appsPath(accountId), body);
}

/** Find an Access application by name. Returns undefined if missing. */
export async function getAccessApplication(
  client: CfClient,
  accountId: string,
  name: string,
): Promise<CfAccessApp | undefined> {
  try {
    const list = await accessList<CfAccessApp>(client, appsPath(accountId));

    return list.find((app) => app.name === name);
  } catch {
    return undefined;
  }
}
