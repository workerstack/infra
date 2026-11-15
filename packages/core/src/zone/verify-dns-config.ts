import type { CfClient } from "../api/client.ts";
import { findMissing, findUndeclared } from "./dns-diff.ts";
import { listAllDnsRecords } from "./dns-records.ts";
import type { DnsConfigView, DnsVerifyResult } from "./dns-types.ts";
import { getDnssecStatus } from "./dnssec.ts";
import { resolveName } from "./resolve-name.ts";

/** Compares declared DNS records with the live zone and reports what is missing or undeclared. */
export async function verifyDnsConfig(client: CfClient, config: DnsConfigView): Promise<DnsVerifyResult> {
  const { domain } = config;
  const live = await listAllDnsRecords(client);
  const dnssec = await getDnssecStatus(client);
  const declared = config.dns.records.map((record) => ({ ...record, name: resolveName(record.name, domain) }));

  return {
    declared: declared.length,
    dnssec,
    live: live.length,
    missing: findMissing(live, declared, domain),
    undeclared: findUndeclared(live, declared, domain),
  };
}
