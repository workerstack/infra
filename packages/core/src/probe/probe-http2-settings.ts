import { alpnName } from "./alpn-name.ts";
import { consumeHttp2Frames } from "./consume-http2-frames.ts";
import { decodeSettingsPayload } from "./decode-settings-payload.ts";
import { emptySettingsFrame } from "./empty-settings-frame.ts";
import { firstServerSettings } from "./first-server-settings.ts";
import type { Http2Result } from "./http2-result.ts";
import { HTTP2_PREFACE } from "./http2.constants.ts";
import type { ProbeTarget } from "./probe-target.ts";
import { ALPN_H2, READ_TIMEOUT_MS } from "./probe.constants.ts";
import { readUntil } from "./read-until.ts";
import { withSocket } from "./with-socket.ts";

function serverSettings(buf: Buffer): Buffer | null {
  return firstServerSettings(consumeHttp2Frames(buf).frames);
}

/** The server's first SETTINGS frame over an h2 connection, or the error; ALPN must pick h2. */
export async function probeHttp2Settings(target: ProbeTarget): Promise<Http2Result> {
  try {
    return await withSocket(target, [ALPN_H2], async (socket): Promise<Http2Result> => {
      if (alpnName(socket) !== ALPN_H2)
        return { kind: "error", message: `ALPN negotiated ${alpnName(socket) ?? "none"}, not ${ALPN_H2}` };

      socket.write(Buffer.concat([Buffer.from(HTTP2_PREFACE), emptySettingsFrame()]));

      const raw = await readUntil(socket, READ_TIMEOUT_MS, (buf) => serverSettings(buf) !== null);
      const payload = serverSettings(raw);

      return payload === null
        ? { kind: "error", message: "no server SETTINGS frame" }
        : { kind: "ok", settings: decodeSettingsPayload(payload) };
    });
  } catch (error) {
    return { kind: "error", message: error instanceof Error ? error.message : String(error) };
  }
}
