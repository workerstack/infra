import type { CfClient } from "../api/client.ts";
import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { verifyDnsConfig } from "../zone/verify-dns-config.ts";
import type { CloudflareTarget } from "./cloudflare-target.ts";
import { getCloudflareAccount } from "./get-cloudflare-account.ts";
import { reportDns } from "./report-dns.ts";
import { reportZoneRules } from "./report-zone-rules.ts";
import { verifyZoneConfig } from "./verify-zone-config.ts";

/** The `infra get` report for a product's Cloudflare config: zone rules, settings, DNS, then the account side. */
export async function getCloudflare(client: CfClient, target: CloudflareTarget, log: Log = stdoutLog): Promise<void> {
  const { zone } = target.config;

  log(`\n Cloudflare: ${target.name} (${zone.domain}) [${zone.zoneId}]`);

  reportZoneRules(await verifyZoneConfig(client, zone), log);
  reportDns(await verifyDnsConfig(client, zone), log);

  await getCloudflareAccount(client, target, log);
}
