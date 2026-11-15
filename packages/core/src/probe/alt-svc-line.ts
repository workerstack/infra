import type { Http11Result } from "./http11-result.ts";

/** The alt-svc line of a successful HTTP/1.1 probe; `(none)` when the server sent no header. */
export function altSvcLine(http11: Extract<Http11Result, { kind: "ok" }>): string {
  return http11.altSvc === null || http11.altSvc === "" ? "alt-svc: (none)" : `alt-svc: ${http11.altSvc}`;
}
