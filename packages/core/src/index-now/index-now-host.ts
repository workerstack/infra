import type { InfraConfig } from "../schema/infra.ts";

/** The host IndexNow pushes for: `indexNow.host`, else the zone domain; throws when there is neither. */
export function indexNowHost(config: InfraConfig): string {
  const host = config.indexNow?.host ?? config.cloudflare?.zone.domain;

  if (host === undefined)
    throw new Error("indexNow.host is unset and there is no cloudflare.zone.domain to default to");

  return host;
}
