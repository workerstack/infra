import type { CfClient } from "../api/client.ts";
import type { ZoneConfig } from "../schema/zone.ts";
import type { Log } from "../shared/log.ts";
import { enableDnssec } from "../zone/dnssec.ts";
import { PENDING } from "../zone/pending.constants.ts";
import { setDnsRecords } from "../zone/set-dns-records.ts";

async function applyDnssec(client: CfClient, log: Log): Promise<void> {
  log("  DNSSEC ...");

  const status = await enableDnssec(client);

  log(`    → ${status.status}`);

  if (status.status === PENDING && status.dsRecord !== undefined && status.dsRecord !== "") {
    log("    ⚠ Add DS record at your domain registrar:");
    log(`      ${status.dsRecord}`);
  }
}

/** Reconciles the DNS records, printing the counts and any undeclared records, then turns DNSSEC on if declared. */
export async function applyDns(client: CfClient, config: ZoneConfig, log: Log): Promise<void> {
  log("  DNS records ...");

  const result = await setDnsRecords(client, config);

  log(`    → ${result.created} created, ${result.updated} updated, ${result.unchanged} unchanged`);

  if (result.undeclared.length > 0) {
    log(`    ⚠ ${result.undeclared.length} undeclared record(s) in zone (not managed by config):`);

    for (const record of result.undeclared) log(`      ${record.type} ${record.name} → ${record.content}`);
  }

  if (config.dns.dnssec) await applyDnssec(client, log);
}
