import type { CfDnsRecord } from "../dns-types.ts";
import { DKIM_CF, DKIM_SES_KEY, DMARC_REJECT, DOMAIN, GOOGLE_VERIFICATION, SPF_ROOT } from "./dns-declared.ts";
import { LIVE_RECORDS } from "./dns-live.ts";

const WWW: CfDnsRecord = {
  content: DOMAIN,
  id: "r_www",
  locked: false,
  name: `www.${DOMAIN}`,
  proxied: true,
  ttl: 1,
  type: "CNAME",
};

const CONTENT_BY_ID: Record<string, string> = {
  r_dkim_cf: `"${DKIM_CF}"`,
  r_dkim_mail: `"p=${DKIM_SES_KEY}"`,
  r_dmarc: `"${DMARC_REJECT}"`,
  r_gsc: `"${GOOGLE_VERIFICATION}"`,
  r_spf: `"${SPF_ROOT}"`,
};

/** Live records that already match every declared record, so a sync changes nothing. */
export const RECONCILED_RECORDS: CfDnsRecord[] = [
  ...LIVE_RECORDS.filter((record) => record.id !== "r_cdn").map((record) => ({
    ...record,
    content: CONTENT_BY_ID[record.id] ?? record.content,
  })),
  WWW,
];
