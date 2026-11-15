import type { DnsRecordInput } from "../schema/dns.ts";
import { isManaged, matchRecord, normalizeContent, resolveTtl } from "./dns-records.ts";
import type { CfDnsRecord, DnsRecordRef } from "./dns-types.ts";
import { MX } from "./mx.constants.ts";
import { resolveName } from "./resolve-name.ts";
import { TXT } from "./txt.constants.ts";

/** The live records a declared record is matched against. */
export type DnsMatchScope = { claimed: Set<string>; domain: string; live: CfDnsRecord[] };

/**
 * The leading token of a TXT record, for identity matching.
 * `v=spf1 ...` gives `v=spf1`; `google-site-verification=X` stays whole.
 */
function txtIdentityPrefix(content: string): string {
  const normalized = normalizeContent(TXT, content);

  return normalized.split(" ", 1)[0] ?? normalized;
}

/**
 * Finds the live record that corresponds to a declared record.
 *
 * 1. An exact match (type, name, content): the record is the same.
 * 2. One live record of the same type and name: its content drifted.
 * 3. Several on one name: TXT by content prefix, MX by priority.
 * 4. Otherwise the first unclaimed one.
 */
export function findLiveMatch(declared: DnsRecordInput, scope: DnsMatchScope): CfDnsRecord | undefined {
  const { claimed, domain, live } = scope;
  const exact = live.find((record) => !claimed.has(record.id) && matchRecord(declared, record, domain));

  if (exact !== undefined) return exact;

  const resolvedName = resolveName(declared.name, domain);

  const candidates = live.filter(
    (record) => !claimed.has(record.id) && record.type === declared.type && record.name === resolvedName,
  );

  if (candidates.length <= 1) return candidates[0];

  if (declared.type === TXT) {
    const prefix = txtIdentityPrefix(declared.content);

    return candidates.find((record) => txtIdentityPrefix(record.content) === prefix);
  }

  if (declared.type === MX && declared.priority !== undefined)
    return candidates.find((record) => record.priority === declared.priority);

  return candidates[0];
}

/** True when the live record differs from the declared one in content, proxy, TTL or comment. */
export function needsUpdate(declared: DnsRecordInput, live: CfDnsRecord): boolean {
  return (
    normalizeContent(declared.type, declared.content) !== normalizeContent(live.type, live.content) ||
    (declared.proxied !== undefined && declared.proxied !== live.proxied) ||
    resolveTtl(declared.ttl) !== live.ttl ||
    (declared.comment !== undefined && declared.comment !== live.comment)
  );
}

/** The unmanaged live records no declared record matches. */
export function findUndeclared(live: CfDnsRecord[], declared: DnsRecordInput[], domain: string): DnsRecordRef[] {
  return live
    .filter((record) => !isManaged(record) && !declared.some((one) => matchRecord(one, record, domain)))
    .map(({ content, name, type }) => ({ content, name, type }));
}

/** The declared records no live record matches. */
export function findMissing(live: CfDnsRecord[], declared: DnsRecordInput[], domain: string): DnsRecordRef[] {
  return declared
    .filter((one) => !live.some((record) => matchRecord(one, record, domain)))
    .map(({ content, name, type }) => ({ content, name, type }));
}
