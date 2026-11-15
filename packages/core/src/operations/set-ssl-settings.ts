import type { CfClient } from "../api/client.ts";
import type { ZoneConfig } from "../schema/zone.ts";
import { patchSetting } from "./patch-setting.ts";
import { patchSettings } from "./patch-settings.ts";
import type { SecurityHeaderValue } from "./security-header-value.ts";
import { SETTING_TOGGLE } from "./setting-toggle.constants.ts";
import { ZONE_SETTING } from "./zone-setting.constants.ts";

/** Patches the TLS settings, then the `security_header` setting with every HSTS field. */
export async function setSslSettings(client: CfClient, config: ZoneConfig): Promise<void> {
  const { alwaysHttps, autoRewrites, hsts, minTls, tls13 } = config.ssl;

  await patchSettings(client, [
    [ZONE_SETTING.ALWAYS_USE_HTTPS, alwaysHttps ? SETTING_TOGGLE.ON : SETTING_TOGGLE.OFF],
    [ZONE_SETTING.AUTOMATIC_HTTPS_REWRITES, autoRewrites ? SETTING_TOGGLE.ON : SETTING_TOGGLE.OFF],
    [ZONE_SETTING.MIN_TLS_VERSION, minTls],
    [ZONE_SETTING.TLS_1_3, tls13 ? SETTING_TOGGLE.ON : SETTING_TOGGLE.OFF],
  ]);

  const securityHeader: SecurityHeaderValue = {
    strict_transport_security: {
      enabled: hsts.enabled,
      include_subdomains: hsts.includeSubDomains,
      max_age: hsts.maxAge,
      nosniff: hsts.nosniff,
      preload: hsts.preload,
    },
  };

  await patchSetting(client, ZONE_SETTING.SECURITY_HEADER, securityHeader);
}
