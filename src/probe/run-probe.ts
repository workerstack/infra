import { probeAlpn } from "./probe-alpn.ts";
import { probeHttp2Settings } from "./probe-http2-settings.ts";
import { probeHttp3Curl } from "./probe-http3-curl.ts";
import { probeHttp11 } from "./probe-http11.ts";
import type { ProbeResult } from "./probe-result.ts";
import type { ProbeTarget } from "./probe-target.ts";
import { ALPN_OFFERED } from "./probe.constants.ts";
import type { SpawnText } from "./spawn-text.ts";

/** Runs the ALPN, HTTP/1.1, HTTP/2 and HTTP/3 probes on one host at once. A failed ALPN connect rejects. */
export async function runProbe(target: ProbeTarget, spawnText: SpawnText): Promise<ProbeResult> {
  const [alpn, http11, http2, http3] = await Promise.all([
    probeAlpn(target),
    probeHttp11(target),
    probeHttp2Settings(target),
    probeHttp3Curl(target, spawnText),
  ]);

  return {
    alpnAccepted: alpn.accepted,
    alpnOffered: ALPN_OFFERED,
    host: target.host,
    http11,
    http2,
    http3,
    port: target.port,
    tlsVersion: alpn.tlsVersion,
  };
}
