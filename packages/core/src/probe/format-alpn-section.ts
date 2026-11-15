import type { ProbeResult } from "./probe-result.ts";

/** The TLS and ALPN lines of the report. */
export function formatAlpnSection(result: ProbeResult): string[] {
  return [
    "=== 1. TLS / ALPN ===",
    `tls=${result.tlsVersion ?? "unknown"}  alpn=${result.alpnAccepted ?? "none"}`,
    `offered: ${result.alpnOffered.join(",")}`,
  ];
}
