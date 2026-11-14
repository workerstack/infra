import type { DnsRecordInput } from "../../schema/dns.ts";

export const DOMAIN = "example.com";
export const DKIM_CF_KEY = "K".repeat(300);
export const DKIM_SES_KEY = "S".repeat(160);
export const GOOGLE_VERIFICATION = "google-site-verification=example-token";
export const DMARC_RUA = "mailto:reports@example.net";
export const SPF_ROOT = "v=spf1 include:_spf.mx.example.net include:mail.example.org -all";
export const DMARC_REJECT = `v=DMARC1; p=reject; sp=reject; rua=${DMARC_RUA}`;
export const DKIM_CF = `v=DKIM1; h=sha256; k=rsa; p=${DKIM_CF_KEY}`;

export const MX_HOST = "mx.example.net";

/** The desired state: SPF hardfail with a mail provider, DMARC reject and a `www` CNAME. */
export const DECLARED_RECORDS: DnsRecordInput[] = [
  { content: "192.0.2.1", name: "@", proxied: true, ttl: "auto", type: "A" },
  { content: DOMAIN, name: "www", proxied: true, ttl: "auto", type: "CNAME" },
  { content: `route1.${MX_HOST}`, name: "@", priority: 50, ttl: "auto", type: "MX" },
  { content: `route2.${MX_HOST}`, name: "@", priority: 71, ttl: "auto", type: "MX" },
  { content: `route3.${MX_HOST}`, name: "@", priority: 68, ttl: "auto", type: "MX" },
  { content: "feedback.mail.example.org", name: "send", priority: 10, ttl: 3600, type: "MX" },
  { content: SPF_ROOT, name: "@", ttl: "auto", type: "TXT" },
  { content: "v=spf1 include:mail.example.org ~all", name: "send", ttl: 3600, type: "TXT" },
  { content: DKIM_CF, name: "cf2024-1._domainkey", ttl: "auto", type: "TXT" },
  { content: `p=${DKIM_SES_KEY}`, name: "mail._domainkey", ttl: 3600, type: "TXT" },
  { content: DMARC_REJECT, name: "_dmarc", ttl: "auto", type: "TXT" },
  { content: GOOGLE_VERIFICATION, name: "@", ttl: 3600, type: "TXT" },
];
