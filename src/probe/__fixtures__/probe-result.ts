import { decodeSettingsPayload } from "../decode-settings-payload.ts";
import { encodeSettingsPayload } from "../encode-settings-payload.ts";
import type { Http2Setting } from "../http2-setting.ts";
import type { ProbeResult } from "../probe-result.ts";

/** The settings a server sent, as the probe decodes them from `[id, value]` pairs. */
export function settings(entries: [number, number][]): Http2Setting[] {
  return decodeSettingsPayload(encodeSettingsPayload(entries.map(([id, value]) => ({ id, value }))));
}

/** A healthy Cloudflare-shaped result, with `overrides` on top. */
export function probeResult(overrides: Partial<ProbeResult> = {}): ProbeResult {
  return {
    alpnAccepted: "h2",
    alpnOffered: ["h2", "http/1.1"],
    host: "api.example.com",
    http11: { altSvc: 'h3=":443"; ma=86400', kind: "ok", statusLine: "HTTP/1.1 404 Not Found" },
    http2: {
      kind: "ok",
      settings: settings([
        [3, 100],
        [4, 65_536],
        [5, 16_777_215],
      ]),
    },
    http3: { kind: "skipped", reason: "curl built without HTTP/3" },
    port: 443,
    tlsVersion: "TLSv1.3",
    ...overrides,
  };
}
