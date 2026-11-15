import type { Http2Setting } from "./http2-setting.ts";

/** What the HTTP/2 probe found. */
export type Http2Result = { kind: "ok"; settings: Http2Setting[] } | { kind: "error"; message: string };
