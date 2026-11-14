import { ZONE_SETTING } from "../operations/zone-setting.constants.ts";

/** The scalar zone settings a verify reads, in report order. */
export const ZONE_SETTING_KEYS: readonly string[] = [
  ZONE_SETTING.ALWAYS_USE_HTTPS,
  ZONE_SETTING.AUTOMATIC_HTTPS_REWRITES,
  ZONE_SETTING.MIN_TLS_VERSION,
  ZONE_SETTING.TLS_1_3,
  ZONE_SETTING.FONTS,
  ZONE_SETTING.EARLY_HINTS,
];
