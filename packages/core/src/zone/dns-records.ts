import type { CfClient } from "../api/client.ts";
import { AUTO } from "./auto.constants.ts";
import { DNS_AUTO_TTL } from "./dns-auto-ttl.constants.ts";
import { DNS_PAGE_SIZE } from "./dns-page-size.constants.ts";
import type { CfDnsRecord, DnsComparable } from "./dns-types.ts";
import { MX_TRAILING_DOT } from "./mx-trailing-dot.constants.ts";
import { MX } from "./mx.constants.ts";
import { resolveName } from "./resolve-name.ts";
import { TXT_CHUNK } from "./txt-chunk.constants.ts";
import { TXT } from "./txt.constants.ts";

/** Normalizes CF content for comparison: strips TXT quotes and chunks, MX trailing dots. */
export function normalizeContent(type: string, content: string): string {
  if (type === TXT) {
    // CF wraps TXT in outer quotes and splits long values into chunks: "part1" "part2"
    const chunks = [...content.matchAll(TXT_CHUNK)].map(([, chunk]) => chunk);

    return chunks.length > 0 ? chunks.join("") : content;
  }

  return type === MX ? content.replace(MX_TRAILING_DOT, "") : content;
}

/**
 * Match key: type, resolved name and normalized content.
 * MX records also match on priority, since one name can hold several MX records.
 */
export function matchRecord(declared: DnsComparable, live: DnsComparable, domain: string): boolean {
  if (declared.type !== live.type) return false;

  if (resolveName(declared.name, domain) !== live.name) return false;

  if (normalizeContent(declared.type, declared.content) !== normalizeContent(live.type, live.content)) return false;

  if (declared.type === MX && declared.priority !== undefined && live.priority !== undefined)
    return declared.priority === live.priority;

  return true;
}

/** Every record of the zone, page by page. */
export async function listAllDnsRecords(client: CfClient, page = 1): Promise<CfDnsRecord[]> {
  const batch = await client.request<CfDnsRecord[]>(
    "GET",
    `/zones/${client.zoneId}/dns_records?per_page=${DNS_PAGE_SIZE}&page=${page}`,
  );

  if (batch.length < DNS_PAGE_SIZE) return batch;

  return [...batch, ...(await listAllDnsRecords(client, page + 1))];
}

/** True for records Cloudflare or an app owns: locked, app-managed or auto-added. */
export function isManaged(record: CfDnsRecord): boolean {
  return record.locked || record.meta?.managed_by_apps === true || record.meta?.auto_added === true;
}

/** The TTL number the API takes for a declared TTL. */
export function resolveTtl(ttl: "auto" | number | undefined): number {
  return ttl === undefined || ttl === AUTO ? DNS_AUTO_TTL : ttl;
}
