import { SETTING_ID_BYTES, SETTINGS_ENTRY_BYTES } from "./http2.constants.ts";

/** The payload of a SETTINGS frame holding `entries`. */
export function encodeSettingsPayload(entries: readonly { id: number; value: number }[]): Buffer {
  const buffer = Buffer.alloc(entries.length * SETTINGS_ENTRY_BYTES);

  for (const [index, entry] of entries.entries()) {
    const offset = index * SETTINGS_ENTRY_BYTES;

    buffer.writeUInt16BE(entry.id, offset);
    buffer.writeUInt32BE(entry.value, offset + SETTING_ID_BYTES);
  }

  return buffer;
}
