import { FRAME_HEADER_BYTES, FRAME_LENGTH_BYTES, FRAME_TYPE_OFFSET, HTTP2_FRAME_SETTINGS } from "./http2.constants.ts";

/** A SETTINGS frame with no entries and no flags: what a client sends after the preface. */
export function emptySettingsFrame(): Buffer {
  const frame = Buffer.alloc(FRAME_HEADER_BYTES);

  frame.writeUIntBE(0, 0, FRAME_LENGTH_BYTES);
  frame[FRAME_TYPE_OFFSET] = HTTP2_FRAME_SETTINGS;

  return frame;
}
