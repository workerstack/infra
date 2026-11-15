import { BRACKET_HOST, PLAIN_HOST, TRAILING_SLASHES } from "./probe-patterns.constants.ts";
import type { ProbeTarget } from "./probe-target.ts";
import { DEFAULT_HTTPS_PORT, MAX_PORT, URL_PROTOCOLS } from "./probe.constants.ts";

function checkedPort(text: string | undefined, raw: string): number {
  const port = text === undefined || text === "" ? DEFAULT_HTTPS_PORT : Number(text);

  if (!Number.isInteger(port) || port < 1 || port > MAX_PORT) throw new Error(`Invalid port in ${raw}`);

  return port;
}

function fromUrl(text: string): ProbeTarget {
  const url = new URL(text);

  if (!URL_PROTOCOLS.includes(url.protocol)) throw new Error(`Unsupported protocol ${url.protocol}`);

  return { host: url.hostname, port: checkedPort(url.port, text) };
}

/** A host, `host:port`, `[v6]:port` or a pasted URL as a target; the port is the TLS port, 443 when none. */
export function parseProbeTarget(raw: string): ProbeTarget {
  const trimmed = raw.trim().replace(TRAILING_SLASHES, "");

  if (trimmed.length === 0) throw new Error("Host is required");

  if (trimmed.includes("://")) return fromUrl(trimmed);

  const [, host, port] = BRACKET_HOST.exec(trimmed) ?? PLAIN_HOST.exec(trimmed) ?? [];

  if (host === undefined) throw new Error(`Invalid host ${trimmed}`);

  return { host, port: checkedPort(port, trimmed) };
}
