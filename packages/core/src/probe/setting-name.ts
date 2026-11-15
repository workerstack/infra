import { HEX_RADIX, SETTING_NAMES } from "./http2.constants.ts";

/** The RFC name of a setting id; an unknown id is `0x` and its hex. */
export function settingName(id: number): string {
  return SETTING_NAMES.find(([known]) => known === id)?.[1] ?? `0x${id.toString(HEX_RADIX)}`;
}
