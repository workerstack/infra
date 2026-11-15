import * as z from "zod";

/**
 * DNS record — one authoritative entry. Use apex names (`@` / bare) or short names
 * (`www`, `api`); infra normalizes to FQDN at apply time.
 */
function dnsRecordSchema(): z.ZodType<DnsRecord, DnsRecordInput> {
  return z.object({
    /** Free-text note visible in the CF dashboard. */
    comment: z.string().optional(),
    /** Value the record points to: IP (A/AAAA), target FQDN (CNAME/MX), or text (TXT/SPF). */
    content: z.string(),
    /** Subdomain label or `@` for apex, e.g. `@`, `www`, `api`, `_dmarc`. */
    name: z.string(),
    /** MX / SRV only. Lower = higher priority. */
    priority: z.number().optional(),
    /**
     * When true, traffic flows through CF's proxy (orange cloud) instead of directly hitting
     * origin. Only legal for A/AAAA/CNAME. Implications:
     * - Origin IP is hidden from the internet — good for DDoS protection.
     * - Only HTTP ports are proxied: 80, 443, 2052, 2053, 2082, 2083, 2086, 2087, 2095, 2096,
     *   8080, 8443, 8880. SSH (22), SMTP (25), DB (5432), arbitrary ports — NOT proxied even
     *   with orange cloud on; those connections fail (or expose origin if IP leaks).
     * - Email MX records must stay unproxied (grey cloud); SMTP isn't an HTTP protocol.
     * - Long-running WebSockets survive, but CF enforces its own 100s idle timeout.
     * - `_acme-challenge`, DKIM, DMARC, SPF TXT records — always grey (proxying TXT is nonsensical).
     */
    proxied: z.boolean().optional(),
    /**
     * Seconds. `auto` = CF-managed (300s for grey cloud, 1 internally for proxied — the
     * proxy re-resolves behind the scenes so low TTL doesn't matter). Explicit numeric TTL
     * is rarely needed; set higher (e.g. 86400) for records you want aggressively cached
     * downstream (SPF, MX) to reduce resolver chatter.
     */
    ttl: z.union([z.literal("auto"), z.number()]).default("auto"),
    /** Record type. */
    type: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "SRV", "CAA"]),
  });
}

export function dnsConfigSchema(): z.ZodType<DnsConfig, DnsConfigInput> {
  return z.object({
    /**
     * Enable DNSSEC signing at CF. You must add the returned DS record to your registrar
     * after apply (infra prints it). Without the DS record at the registrar, enabling
     * DNSSEC here is a no-op — but don't leave the DS record published without DNSSEC
     * enabled here, or the domain will fail to resolve.
     */
    dnssec: z.boolean().default(false),
    /**
     * Desired records. Records NOT listed here that exist in the zone are reported as
     * "undeclared" (not deleted — infra never removes records it didn't create, to
     * protect against accidental wipes).
     */
    records: z.array(dnsRecordSchema()).default([]),
  });
}

/**
 * DNS record — one authoritative entry. Use apex names (`@` / bare) or short names
 * (`www`, `api`); infra normalizes to FQDN at apply time.
 */
export type DnsRecordInput = {
  /** Free-text note visible in the CF dashboard. */
  comment?: string | undefined;
  /** Value the record points to: IP (A/AAAA), target FQDN (CNAME/MX), or text (TXT/SPF). */
  content: string;
  /** Subdomain label or `@` for apex, e.g. `@`, `www`, `api`, `_dmarc`. */
  name: string;
  /** MX / SRV only. Lower = higher priority. */
  priority?: number | undefined;
  /**
   * When true, traffic flows through CF's proxy (orange cloud) instead of directly hitting
   * origin. Only legal for A/AAAA/CNAME. Implications:
   * - Origin IP is hidden from the internet — good for DDoS protection.
   * - Only HTTP ports are proxied: 80, 443, 2052, 2053, 2082, 2083, 2086, 2087, 2095, 2096,
   *   8080, 8443, 8880. SSH (22), SMTP (25), DB (5432), arbitrary ports — NOT proxied even
   *   with orange cloud on; those connections fail (or expose origin if IP leaks).
   * - Email MX records must stay unproxied (grey cloud); SMTP isn't an HTTP protocol.
   * - Long-running WebSockets survive, but CF enforces its own 100s idle timeout.
   * - `_acme-challenge`, DKIM, DMARC, SPF TXT records — always grey (proxying TXT is nonsensical).
   */
  proxied?: boolean | undefined;
  /**
   * Seconds. `auto` = CF-managed (300s for grey cloud, 1 internally for proxied — the
   * proxy re-resolves behind the scenes so low TTL doesn't matter). Explicit numeric TTL
   * is rarely needed; set higher (e.g. 86400) for records you want aggressively cached
   * downstream (SPF, MX) to reduce resolver chatter.
   */
  ttl?: "auto" | number | undefined;
  /** Record type. */
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "SRV" | "CAA";
};

/**
 * DNS record — one authoritative entry. Use apex names (`@` / bare) or short names
 * (`www`, `api`); infra normalizes to FQDN at apply time.
 */
export type DnsRecord = {
  /** Free-text note visible in the CF dashboard. */
  comment?: string | undefined;
  /** Value the record points to: IP (A/AAAA), target FQDN (CNAME/MX), or text (TXT/SPF). */
  content: string;
  /** Subdomain label or `@` for apex, e.g. `@`, `www`, `api`, `_dmarc`. */
  name: string;
  /** MX / SRV only. Lower = higher priority. */
  priority?: number | undefined;
  /**
   * When true, traffic flows through CF's proxy (orange cloud) instead of directly hitting
   * origin. Only legal for A/AAAA/CNAME. Implications:
   * - Origin IP is hidden from the internet — good for DDoS protection.
   * - Only HTTP ports are proxied: 80, 443, 2052, 2053, 2082, 2083, 2086, 2087, 2095, 2096,
   *   8080, 8443, 8880. SSH (22), SMTP (25), DB (5432), arbitrary ports — NOT proxied even
   *   with orange cloud on; those connections fail (or expose origin if IP leaks).
   * - Email MX records must stay unproxied (grey cloud); SMTP isn't an HTTP protocol.
   * - Long-running WebSockets survive, but CF enforces its own 100s idle timeout.
   * - `_acme-challenge`, DKIM, DMARC, SPF TXT records — always grey (proxying TXT is nonsensical).
   */
  proxied?: boolean | undefined;
  /**
   * Seconds. `auto` = CF-managed (300s for grey cloud, 1 internally for proxied — the
   * proxy re-resolves behind the scenes so low TTL doesn't matter). Explicit numeric TTL
   * is rarely needed; set higher (e.g. 86400) for records you want aggressively cached
   * downstream (SPF, MX) to reduce resolver chatter.
   */
  ttl: "auto" | number;
  /** Record type. */
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "SRV" | "CAA";
};

/**
 * DNS configuration for the zone.
 */
export type DnsConfigInput = {
  /**
   * Enable DNSSEC signing at CF. You must add the returned DS record to your registrar
   * after apply (infra prints it). Without the DS record at the registrar, enabling
   * DNSSEC here is a no-op — but don't leave the DS record published without DNSSEC
   * enabled here, or the domain will fail to resolve.
   */
  dnssec?: boolean | undefined;
  /**
   * Desired records. Records NOT listed here that exist in the zone are reported as
   * "undeclared" (not deleted — infra never removes records it didn't create, to
   * protect against accidental wipes).
   */
  records?: DnsRecordInput[] | undefined;
};

/**
 * DNS configuration for the zone.
 */
export type DnsConfig = {
  /**
   * Enable DNSSEC signing at CF. You must add the returned DS record to your registrar
   * after apply (infra prints it). Without the DS record at the registrar, enabling
   * DNSSEC here is a no-op — but don't leave the DS record published without DNSSEC
   * enabled here, or the domain will fail to resolve.
   */
  dnssec: boolean;
  /**
   * Desired records. Records NOT listed here that exist in the zone are reported as
   * "undeclared" (not deleted — infra never removes records it didn't create, to
   * protect against accidental wipes).
   */
  records: DnsRecord[];
};
