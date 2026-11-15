import { readFileSync, readdirSync, readlinkSync } from "node:fs";

import { HEX_RADIX, PID_ENTRY, SOCKET_LINK, TCP_INODE_AT, TCP_LISTEN, TCP_STATE_AT } from "./local.constants.ts";
import { readOrUndefined } from "./read-or-undefined.ts";
import { WHITESPACE_RUN } from "./whitespace-run.constants.ts";

const TCP_TABLES = ["/proc/net/tcp", "/proc/net/tcp6"];

// Field 1 is `address:port` in hex; then the state and the socket's inode.
function listeningInode(line: string, port: number): string | undefined {
  const fields = line.trim().split(WHITESPACE_RUN);
  const local = fields[1];

  if (local === undefined || fields[TCP_STATE_AT] !== TCP_LISTEN) return undefined;

  return Number.parseInt(local.slice(local.lastIndexOf(":") + 1), HEX_RADIX) === port
    ? fields[TCP_INODE_AT]
    : undefined;
}

function listeningInodes(port: number): Set<string> {
  const lines = TCP_TABLES.flatMap((table) => {
    const text = readOrUndefined(() => readFileSync(table, "utf8"));

    return text?.split("\n").slice(1) ?? [];
  });

  return new Set(lines.flatMap((line) => listeningInode(line, port) ?? []));
}

function holdsSocket(pid: string, inodes: Set<string>): boolean {
  const fds = readOrUndefined(() => readdirSync(`/proc/${pid}/fd`)) ?? [];

  return fds.some((fd) => {
    const inode = SOCKET_LINK.exec(readOrUndefined(() => readlinkSync(`/proc/${pid}/fd/${fd}`)) ?? "")?.[1];

    return inode !== undefined && inodes.has(inode);
  });
}

/** The pids holding a socket listening on `port`, from /proc/net/tcp and each process's fds. */
export function linuxPortPids(port: number): number[] {
  const inodes = listeningInodes(port);

  if (inodes.size === 0) return [];

  return (readOrUndefined(() => readdirSync("/proc")) ?? [])
    .filter((entry) => PID_ENTRY.test(entry) && holdsSocket(entry, inodes))
    .map(Number);
}
