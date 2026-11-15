import type { ProbeTarget } from "./probe-target.ts";
import { DEFAULT_HTTPS_PORT } from "./probe.constants.ts";

/** The `https` URL of a target; an IPv6 address is bracketed and the default port left out. */
export function probeUrl(target: ProbeTarget): string {
  const host = target.host.includes(":") && !target.host.startsWith("[") ? `[${target.host}]` : target.host;
  const port = target.port === DEFAULT_HTTPS_PORT ? "" : `:${target.port}`;

  return `https://${host}${port}/`;
}
