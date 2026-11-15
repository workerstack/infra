import { parseZoneConfig } from "../../schema/zone.ts";
import type { ZoneConfig, ZoneConfigInput } from "../../schema/zone.ts";

/** A parsed zone config for `example.com` and zone `zid`, with `overrides` applied. */
export function zoneConfig(overrides: Partial<ZoneConfigInput> = {}): ZoneConfig {
  return parseZoneConfig({ domain: "example.com", zoneId: "zid", ...overrides });
}
