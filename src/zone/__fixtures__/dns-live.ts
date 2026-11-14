import type { CfDnsRecord } from "../dns-types.ts";
import { DKIM_CF, DKIM_SES_KEY, DMARC_RUA, DOMAIN, GOOGLE_VERIFICATION, MX_HOST } from "./dns-declared.ts";


function live(record: Partial<CfDnsRecord> & Pick<CfDnsRecord, "content" | "id" | "name" | "type">): CfDnsRecord {
  return { locked: false, proxied: false, ttl: 1, ...record };
}

/** What Cloudflare returns before hardening: SPF softfail, DMARC `p=none`, no `www`, an app-managed CNAME. */
export const LIVE_RECORDS: CfDnsRecord[] = [
  live({ content: "192.0.2.1", id: "r_a", name: DOMAIN, proxied: true, type: "A" }),
  live({
    content: "example-bucket",
    id: "r_cdn",
    meta: { managed_by_apps: true },
    name: `cdn.${DOMAIN}`,
    proxied: true,
    type: "CNAME",
  }),
  live({ content: `route3.${MX_HOST}.`, id: "r_mx3", name: DOMAIN, priority: 68, type: "MX" }),
  live({ content: `route2.${MX_HOST}.`, id: "r_mx2", name: DOMAIN, priority: 71, type: "MX" }),
  live({ content: `route1.${MX_HOST}.`, id: "r_mx1", name: DOMAIN, priority: 50, type: "MX" }),
  live({
    content: "feedback.mail.example.org.",
    id: "r_mx_send",
    name: `send.${DOMAIN}`,
    priority: 10,
    ttl: 3600,
    type: "MX",
  }),
  live({ content: '"v=spf1 include:_spf.mx.example.net ~all"', id: "r_spf", name: DOMAIN, type: "TXT" }),
  live({ content: `"${GOOGLE_VERIFICATION}"`, id: "r_gsc", name: DOMAIN, ttl: 3600, type: "TXT" }),
  live({
    content: `"${DKIM_CF.slice(0, 200)}" "${DKIM_CF.slice(200)}"`,
    id: "r_dkim_cf",
    name: `cf2024-1._domainkey.${DOMAIN}`,
    type: "TXT",
  }),
  live({
    content: `"v=DMARC1; p=none; rua=${DMARC_RUA}"`,
    id: "r_dmarc",
    name: `_dmarc.${DOMAIN}`,
    type: "TXT",
  }),
  live({
    content: `"p=${DKIM_SES_KEY}"`,
    id: "r_dkim_mail",
    name: `mail._domainkey.${DOMAIN}`,
    ttl: 3600,
    type: "TXT",
  }),
  live({
    content: '"v=spf1 include:mail.example.org ~all"',
    id: "r_spf_send",
    name: `send.${DOMAIN}`,
    ttl: 3600,
    type: "TXT",
  }),
];
