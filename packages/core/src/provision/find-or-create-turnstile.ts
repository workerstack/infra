import type { CfClient } from "../api/client.ts";
import type { CloudflareTurnstileEnv } from "../schema/cloudflare-env.ts";
import { PAGE_SIZE } from "./page-size.constants.ts";
import { TURNSTILE_NO_CLEARANCE } from "./turnstile-no-clearance.constants.ts";

export type CfTurnstileWidget = {
  clearance_level: string;
  domains: string[];
  mode: string;
  name: string;
  secret: string;
  sitekey: string;
};

/**
 * The widget called `config.name`, created when missing, otherwise updated to `config`.
 * Its secret is in the result.
 */
export async function findOrCreateTurnstile(
  client: CfClient,
  accountId: string,
  config: CloudflareTurnstileEnv,
): Promise<CfTurnstileWidget> {
  const path = `/accounts/${accountId}/challenges/widgets`;

  const body = {
    clearance_level: config.clearanceLevel ?? TURNSTILE_NO_CLEARANCE,
    domains: config.domains,
    mode: config.mode,
    name: config.name,
  };

  const listed = await client.request<CfTurnstileWidget[] | { result: CfTurnstileWidget[] }>(
    "GET",
    `${path}?per_page=${PAGE_SIZE}`,
  );

  const widgets = Array.isArray(listed) ? listed : listed.result;
  const match = widgets.find((widget) => widget.name === config.name);

  return match === undefined
    ? client.request<CfTurnstileWidget>("POST", path, body)
    : client.request<CfTurnstileWidget>("PUT", `${path}/${match.sitekey}`, body);
}
