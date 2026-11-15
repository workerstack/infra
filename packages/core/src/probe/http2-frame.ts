/** One HTTP/2 frame. */
export type Http2Frame = { flags: number; payload: Buffer; streamId: number; type: number };
