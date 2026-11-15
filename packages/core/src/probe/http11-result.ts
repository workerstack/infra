/** What the HTTP/1.1 probe found. */
export type Http11Result =
  | { altSvc: string | null; kind: "ok"; statusLine: string }
  | { kind: "error"; message: string };
