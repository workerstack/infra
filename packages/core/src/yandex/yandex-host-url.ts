import type { InfraConfig } from "../schema/infra.ts";

/** The Webmaster host: `yandex.webmaster.hostUrl`, else `https://{zone domain}`; throws when there is neither. */
export function yandexHostUrl(config: InfraConfig): string {
  const hostUrl = config.yandex?.webmaster.hostUrl;
  const domain = config.cloudflare?.zone.domain;

  if (hostUrl !== undefined) return hostUrl;

  if (domain === undefined)
    throw new Error("yandex.webmaster.hostUrl is unset and there is no cloudflare.zone.domain to default to");

  return `https://${domain}`;
}
