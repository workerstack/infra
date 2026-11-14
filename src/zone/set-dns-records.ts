import type { CfClient } from "../api/client.ts";
import type { DnsRecordInput } from "../schema/dns.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { findLiveMatch, findUndeclared, needsUpdate } from "./dns-diff.ts";
import { listAllDnsRecords, resolveTtl } from "./dns-records.ts";
import type { CfDnsRecord, DnsConfigView, DnsReconcileResult } from "./dns-types.ts";
import { resolveName } from "./resolve-name.ts";

async function patchRecord(client: CfClient, declared: DnsRecordInput, live: CfDnsRecord): Promise<void> {
  await client.request("PATCH", `/zones/${client.zoneId}/dns_records/${live.id}`, {
    comment: declared.comment,
    content: declared.content,
    name: declared.name,
    proxied: declared.proxied ?? live.proxied,
    ttl: resolveTtl(declared.ttl),
    type: declared.type,
  });
}

async function createRecord(client: CfClient, declared: DnsRecordInput): Promise<void> {
  await client.request("POST", `/zones/${client.zoneId}/dns_records`, {
    comment: declared.comment,
    content: declared.content,
    name: declared.name,
    priority: declared.priority,
    proxied: declared.proxied ?? false,
    ttl: resolveTtl(declared.ttl),
    type: declared.type,
  });
}

/**
 * Reconciles declared DNS records against live zone state.
 * Creates missing records and updates drifted ones. Never deletes:
 * undeclared records are reported for human review.
 */
export async function setDnsRecords(client: CfClient, config: DnsConfigView): Promise<DnsReconcileResult> {
  const { domain } = config;
  const live = await listAllDnsRecords(client);
  const declared = config.dns.records.map((record) => ({ ...record, name: resolveName(record.name, domain) }));
  const scope = { claimed: new Set<string>(), domain, live };
  const counts = { created: 0, unchanged: 0, updated: 0 };

  await runInOrder(declared, async (record) => {
    const match = findLiveMatch(record, scope);

    if (match === undefined) {
      await createRecord(client, record);
      counts.created += 1;

      return;
    }

    scope.claimed.add(match.id);

    if (needsUpdate(record, match)) {
      await patchRecord(client, record, match);
      counts.updated += 1;
    } else {
      counts.unchanged += 1;
    }
  });

  return { ...counts, undeclared: findUndeclared(live, declared, domain) };
}
