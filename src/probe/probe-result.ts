import type { Http2Result } from "./http2-result.ts";
import type { Http3Result } from "./http3-result.ts";
import type { Http11Result } from "./http11-result.ts";

/** Everything the four probes found on one host. */
export type ProbeResult = {
  alpnAccepted: string | null;
  alpnOffered: readonly string[];
  host: string;
  http11: Http11Result;
  http2: Http2Result;
  http3: Http3Result;
  port: number;
  tlsVersion: string | null;
};
