import type { Http2Frame } from "./http2-frame.ts";
import { HTTP2_FLAG_ACK, HTTP2_FRAME_SETTINGS } from "./http2.constants.ts";

/** The payload of the first SETTINGS frame the server sent on stream 0, skipping acknowledgements. */
export function firstServerSettings(frames: readonly Http2Frame[]): Buffer | null {
  const found = frames.find(
    (frame) => frame.type === HTTP2_FRAME_SETTINGS && frame.streamId === 0 && (frame.flags & HTTP2_FLAG_ACK) === 0,
  );

  return found?.payload ?? null;
}
