import { alpnName } from "./alpn-name.ts";
import type { ProbeTarget } from "./probe-target.ts";
import { ALPN_OFFERED } from "./probe.constants.ts";
import { withSocket } from "./with-socket.ts";

/** The ALPN name and TLS version a host settles on when offered h2 and http/1.1; `null` when it names none. */
export function probeAlpn(target: ProbeTarget): Promise<{ accepted: string | null; tlsVersion: string | null }> {
  return withSocket(target, ALPN_OFFERED, (socket) =>
    Promise.resolve({
      accepted: alpnName(socket),
      tlsVersion: socket.getProtocol(),
    }),
  );
}
