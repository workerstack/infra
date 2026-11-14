import type { CfClient } from "../api/client.ts";
import { ACTIVE } from "./active.constants.ts";
import type { DnssecStatus } from "./dns-types.ts";
import { PENDING } from "./pending.constants.ts";

type CfDnssec = { ds?: string; status: string };

/** The DNSSEC status of the zone; the DS record shows only while it is pending. */
export async function getDnssecStatus(client: CfClient): Promise<DnssecStatus> {
  const result = await client.request<CfDnssec>("GET", `/zones/${client.zoneId}/dnssec`);

  return { dsRecord: result.status === PENDING ? result.ds : undefined, status: result.status };
}

/** Turns DNSSEC on unless it is already active or pending. */
export async function enableDnssec(client: CfClient): Promise<DnssecStatus> {
  const current = await getDnssecStatus(client);

  if (current.status === ACTIVE || current.status === PENDING) return current;

  const result = await client.request<CfDnssec>("PATCH", `/zones/${client.zoneId}/dnssec`, { status: ACTIVE });

  return { dsRecord: result.ds, status: result.status };
}
