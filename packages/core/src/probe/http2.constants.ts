/** Where a frame's flags byte is, after the 3 length bytes and the type byte. */
export const FRAME_FLAGS_OFFSET = 4;

/** Bytes in a frame header. */
export const FRAME_HEADER_BYTES = 9;

/** Bytes of a frame's length field. */
export const FRAME_LENGTH_BYTES = 3;

/** Where a frame's stream id starts. */
export const FRAME_STREAM_ID_OFFSET = 5;

/** Where a frame's type byte is. */
export const FRAME_TYPE_OFFSET = 3;

/** The flag that makes a SETTINGS frame an acknowledgement. */
export const HTTP2_FLAG_ACK = 1;

/** The frame type of SETTINGS. */
export const HTTP2_FRAME_SETTINGS = 4;

/** What a client sends first on an HTTP/2 connection. */
export const HTTP2_PREFACE = "PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n";

/** The bits of a stream id; the top bit is reserved. */
export const HTTP2_STREAM_ID_MASK = 0x7f_ff_ff_ff;

/** The radix an unknown setting id is shown in. */
export const HEX_RADIX = 16;

/** Bytes of a setting's id. */
export const SETTING_ID_BYTES = 2;

/** The id of SETTINGS_MAX_CONCURRENT_STREAMS. */
export const SETTING_MAX_CONCURRENT_STREAMS = 3;

/** Bytes of one setting: a 2-byte id and a 4-byte value. */
export const SETTINGS_ENTRY_BYTES = 6;

/** The settings RFC 9113 and RFC 8441 name, as id and name. */
export const SETTING_NAMES = [
  [1, "HEADER_TABLE_SIZE"],
  [2, "ENABLE_PUSH"],
  [3, "MAX_CONCURRENT_STREAMS"],
  [4, "INITIAL_WINDOW_SIZE"],
  [5, "MAX_FRAME_SIZE"],
  [6, "MAX_HEADER_LIST_SIZE"],
  [8, "ENABLE_CONNECT_PROTOCOL"],
] as const;
