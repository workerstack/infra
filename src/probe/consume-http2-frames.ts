import type { Http2Frame } from "./http2-frame.ts";
import type { Http2FramesRead } from "./http2-frames-read.ts";
import {
  FRAME_FLAGS_OFFSET,
  FRAME_HEADER_BYTES,
  FRAME_LENGTH_BYTES,
  FRAME_STREAM_ID_OFFSET,
  FRAME_TYPE_OFFSET,
  HTTP2_STREAM_ID_MASK,
} from "./http2.constants.ts";

/** The complete frames at the start of `buffer`, and the partial frame left after them. */
export function consumeHttp2Frames(buffer: Buffer): Http2FramesRead {
  const frames: Http2Frame[] = [];
  let offset = 0;

  while (offset + FRAME_HEADER_BYTES <= buffer.length) {
    const length = buffer.readUIntBE(offset, FRAME_LENGTH_BYTES);
    const end = offset + FRAME_HEADER_BYTES + length;

    if (end > buffer.length) break;

    frames.push({
      flags: buffer[offset + FRAME_FLAGS_OFFSET] ?? 0,
      payload: buffer.subarray(offset + FRAME_HEADER_BYTES, end),
      streamId: buffer.readUInt32BE(offset + FRAME_STREAM_ID_OFFSET) & HTTP2_STREAM_ID_MASK,
      type: buffer[offset + FRAME_TYPE_OFFSET] ?? 0,
    });
    offset = end;
  }

  return { frames, rest: buffer.subarray(offset) };
}
