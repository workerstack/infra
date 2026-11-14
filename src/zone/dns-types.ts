import type { DnsRecordInput } from "../schema/dns.ts";

/** A DNS record as the Cloudflare API lists it. */
export type CfDnsRecord = {
  comment?: string;
  content: string;
  id: string;
  locked: boolean;
  meta?: { auto_added?: boolean; managed_by_apps?: boolean };
  name: string;
  priority?: number;
  proxied: boolean;
  ttl: number;
  type: string;
};

/** The part of a zone config the DNS operations read. */
export type DnsConfigView = { dns: { records: DnsRecordInput[] }; domain: string };

/** A record named by what identifies it. */
export type DnsRecordRef = { content: string; name: string; type: string };

/** What a record needs to be compared: its type, name, content and MX priority. */
export type DnsComparable = { content: string; name: string; priority?: number | undefined; type: string };

export type DnsReconcileResult = {
  created: number;
  undeclared: DnsRecordRef[];
  unchanged: number;
  updated: number;
};

export type DnssecStatus = { dsRecord?: string | undefined; status: string };

export type DnsVerifyResult = {
  declared: number;
  dnssec: DnssecStatus;
  live: number;
  missing: DnsRecordRef[];
  undeclared: DnsRecordRef[];
};
