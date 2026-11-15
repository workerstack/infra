import type { CfClient } from "../api/client.ts";
import type { ZoneConfig } from "../schema/zone.ts";
import { patchSettings } from "./patch-settings.ts";
import { SETTING_TOGGLE } from "./setting-toggle.constants.ts";
import { ZONE_SETTING } from "./zone-setting.constants.ts";

/** Patches the speed settings: fonts, then early hints. */
export async function setSpeedSettings(client: CfClient, config: ZoneConfig): Promise<void> {
  const { earlyHints, fonts } = config.speed;

  await patchSettings(client, [
    [ZONE_SETTING.FONTS, fonts ? SETTING_TOGGLE.ON : SETTING_TOGGLE.OFF],
    [ZONE_SETTING.EARLY_HINTS, earlyHints ? SETTING_TOGGLE.ON : SETTING_TOGGLE.OFF],
  ]);
}
