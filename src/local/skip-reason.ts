import { ERRNO_ACCESS, ERRNO_IN_USE } from "./local.constants.ts";

/** Why the edge did not bind its candidate port, as the table prints it. */
export function skipReason(candidate: number, code: string, owner?: string): string {
  if (code === ERRNO_IN_USE) return `port ${candidate} is busy${owner === undefined ? "" : ` (${owner})`}`;

  if (code === ERRNO_ACCESS) {
    const allow = `sudo sysctl -w net.ipv4.ip_unprivileged_port_start=${candidate}`;

    return `port ${candidate} needs privileges; allow it once with \`${allow}\``;
  }

  return `port ${candidate} did not bind (${code})`;
}
