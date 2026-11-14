import type { CfClient } from "../api/client.ts";
import { getSettingRaw } from "./get-setting-raw.ts";
import type { HstsLiveState } from "./hsts-live-state.ts";
import type { SecurityHeaderValue } from "./security-header-value.ts";
import { ZONE_SETTING } from "./zone-setting.constants.ts";

/** The zone's live HSTS settings, read from the `security_header` setting. */
export async function getHstsLiveState(client: CfClient): Promise<HstsLiveState> {
  const raw = await getSettingRaw<SecurityHeaderValue>(client, ZONE_SETTING.SECURITY_HEADER);
  const hsts = raw.strict_transport_security;

  return {
    enabled: hsts.enabled,
    includeSubDomains: hsts.include_subdomains,
    maxAge: hsts.max_age,
    nosniff: hsts.nosniff,
    preload: hsts.preload,
  };
}
