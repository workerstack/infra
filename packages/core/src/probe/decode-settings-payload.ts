import type { Http2Setting } from "./http2-setting.ts";
import { SETTING_ID_BYTES, SETTINGS_ENTRY_BYTES } from "./http2.constants.ts";
import { settingName } from "./setting-name.ts";

/** The entries of a SETTINGS payload; a length that is not whole entries throws. */
export function decodeSettingsPayload(payload: Buffer): Http2Setting[] {
  if (payload.length % SETTINGS_ENTRY_BYTES !== 0)
    throw new Error(`SETTINGS payload length ${payload.length} is not a multiple of ${SETTINGS_ENTRY_BYTES}`);

  const settings: Http2Setting[] = [];

  for (let offset = 0; offset < payload.length; offset += SETTINGS_ENTRY_BYTES) {
    const id = payload.readUInt16BE(offset);

    settings.push({ id, name: settingName(id), value: payload.readUInt32BE(offset + SETTING_ID_BYTES) });
  }

  return settings;
}
