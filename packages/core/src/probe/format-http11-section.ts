import { altSvcLine } from "./alt-svc-line.ts";
import type { ProbeResult } from "./probe-result.ts";

/** The HTTP/1.1 lines of the report. */
export function formatHttp11Section({ http11 }: ProbeResult): string[] {
  return [
    "=== 2. HTTP/1.1 ===",
    ...(http11.kind === "ok" ? [http11.statusLine, altSvcLine(http11)] : [`error: ${http11.message}`]),
  ];
}
