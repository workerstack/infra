/** What the HTTP/3 probe found. */
export type Http3Result =
  | { kind: "ok"; statusLine: string }
  | { kind: "skipped"; reason: string }
  | { kind: "error"; message: string };
