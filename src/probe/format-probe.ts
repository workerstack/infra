import { concurrentStreamCap } from "./concurrent-stream-cap.ts";
import { formatAlpnSection } from "./format-alpn-section.ts";
import { formatHttp2Section } from "./format-http2-section.ts";
import { formatHttp3Section } from "./format-http3-section.ts";
import { formatHttp11Section } from "./format-http11-section.ts";
import type { ProbeResult } from "./probe-result.ts";

/** The report: the four sections, then the browser's stream cap when the HTTP/2 probe answered. */
export function formatProbe(result: ProbeResult): string {
  const lines = [
    ...formatAlpnSection(result),
    "",
    ...formatHttp11Section(result),
    "",
    ...formatHttp2Section(result),
    "",
    ...formatHttp3Section(result),
    "",
    ...(result.http2.kind === "ok" ? [concurrentStreamCap(result.http2.settings)] : []),
  ];

  return `${lines.join("\n")}\n`;
}
