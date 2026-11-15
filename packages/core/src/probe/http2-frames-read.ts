import type { Http2Frame } from "./http2-frame.ts";

/** The complete frames read from a buffer and the partial frame left after them. */
export type Http2FramesRead = { frames: Http2Frame[]; rest: Buffer };
