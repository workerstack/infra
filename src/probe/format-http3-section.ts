import { altSvcLine } from "./alt-svc-line.ts";
import type { Http3Result } from "./http3-result.ts";
import type { ProbeResult } from "./probe-result.ts";

function curlLine(http3: Http3Result): string {
  if (http3.kind === "ok") return `curl --http3: ${http3.statusLine}`;

  return http3.kind === "skipped" ? `curl --http3: skipped (${http3.reason})` : `curl --http3: error: ${http3.message}`;
}

/** The HTTP/3 lines of the report: the server's alt-svc when HTTP/1.1 answered, then what curl saw. */
export function formatHttp3Section({ http11, http3 }: ProbeResult): string[] {
  return ["=== 4. HTTP/3 ===", ...(http11.kind === "ok" ? [altSvcLine(http11)] : []), curlLine(http3)];
}
