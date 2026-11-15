/**
 * A package depending on this is served by Cloudflare's Vite plugin: an app when `local.apps` names it, else left
 * out.
 */
export const VITE_WORKER_PLUGIN = "@cloudflare/vite-plugin";

/** The header the edge sets to name the Worker the dispatcher hands a request to. */
export const WORKER_HEADER = "x-loc-worker";

/** The stack's files under the product root, beside its state file. */
export const LOCK_FILE = ".wrangler/loc/lock.json";

export const REGISTRY_DIR = ".wrangler/loc/registry";

export const DISPATCHER_DIR = ".wrangler/loc/dispatcher";

/** Persisted Worker state (KV, queues, local D1); never wiped by `infra loc`. */
export const STATE_DIR = ".wrangler/state";

/** The dispatcher's Worker name, alone in each stack's registry. */
export const DISPATCHER_NAME = "loc-dispatcher";

export const DISPATCHER_COMPATIBILITY_DATE = "2026-01-20";

/** The origin's preferred port: no port in the URL. */
export const ORIGIN_PORT = 80;

export const LOOPBACK = "127.0.0.1";

/** One dual-stack bind on every address. */
export const ANY_HOST = "::";

/** How many of a child's last lines a crash report shows. */
export const TAIL_LINES = 40;

/** How long a stopped group gets before SIGKILL. */
export const STOP_GRACE_MS = 5000;

/** How often a stop checks whether a group is gone. */
export const STOP_POLL_MS = 50;

/** How long a member gets to answer HTTP after it starts. */
export const READY_TIMEOUT_MS = 180_000;

/** One readiness probe's timeout, and the wait between probes. */
export const READY_PROBE_MS = 2000;

export const READY_POLL_MS = 250;

/** How long a spawned child gets to exec before its cmdline is recorded. */
export const EXEC_POLLS = 200;

export const EXEC_POLL_MS = 10;

/** The statuses the edge and the dispatcher answer with themselves. */
export const NOT_FOUND = 404;

export const BAD_GATEWAY = 502;

export const SERVICE_UNAVAILABLE = 503;

export const ERRNO_IN_USE = "EADDRINUSE";

export const ERRNO_ACCESS = "EACCES";

export const ERRNO_NO_PROCESS = "ESRCH";

/** /proc/net/tcp*: a socket's state, LISTEN, and the radix of its port field. */
export const TCP_LISTEN = "0A";

/** A /proc/net/tcp line's fields: the state, and the socket's inode. */
export const TCP_STATE_AT = 3;

export const TCP_INODE_AT = 9;

export const HEX_RADIX = 16;

/** /proc/<pid>/stat: the fields start two characters after the command's closing paren. */
export const STAT_FIELDS_OFFSET = 2;

/** Field 5 (pgrp) and field 22 (starttime) of /proc/<pid>/stat, counted from field 3. */
export const STAT_PGRP_AT = 2;

/** Field 4 (ppid) of /proc/<pid>/stat, counted from field 3. */
export const STAT_PPID_AT = 1;

export const STAT_START_AT = 19;

/** A /proc entry that is a process. */
export const PID_ENTRY: RegExp = /^\d+$/;

/** A /proc fd link to a socket, holding its inode. */
export const SOCKET_LINK: RegExp = /^socket:\[(\d+)\]$/;

/** The NUL that ends a /proc cmdline. */
export const TRAILING_NUL: RegExp = /\0$/;

/** A route pattern's path, and a subdomain wildcard before its host. */
export const PATTERN_PATH: RegExp = /\/.*$/;

export const SUBDOMAIN_PREFIX: RegExp = /^\*\./;

/** The env names wrangler and Miniflare read their dev registry from: one per stack, so stacks never meet. */
export const REGISTRY_ENV_KEYS = ["MINIFLARE_REGISTRY_PATH", "WRANGLER_REGISTRY_PATH"] as const;

/** The binary a `node` that is really Bun resolves to. */
export const BUN_BINARY = "bun";

/** `ps` on darwin: one line per process, `pid ppid pgid lstart command`, without a header. */
export const PS_FORMAT = "pid=,ppid=,pgid=,lstart=,command=";

/** One `ps` line: pid, ppid, pgid, the fixed 24-char lstart and the command, which may hold spaces and parens. */
export const PS_LINE: RegExp =
  /^\s*(?<pid>\d+)\s+(?<parent>\d+)\s+(?<group>\d+)\s+(?<lstart>(?:\S+\s+){3}\S+\s+\d{4})\s+(?<cmdline>.*)$/;

/** PowerShell on win32: the flags that run one command quietly, and the columns and JSON shape of a process row. */
export const POWERSHELL_FLAGS: readonly string[] = ["-NoProfile", "-NonInteractive", "-Command"];

export const WIN32_COLUMNS =
  "Select-Object ProcessId,ParentProcessId,CreationDate,CommandLine | ConvertTo-Json -Compress";

/** PowerShell 5.1 writes a CIM date as `/Date(<epoch ms>)/`. */
export const CIM_DATE_MS: RegExp = /Date\((-?\d+)\)/;

/** The most a process probe may print, and how long it may run. */
export const TOOL_MAX_BUFFER = 67_108_864;

export const TOOL_TIMEOUT_MS = 30_000;

/** The line ending of a probe's output, either kind. */
export const LINE_BREAK: RegExp = /\r?\n/;

/** `ps` prints lstart with English month and day names only in the C locale. */
export const PS_LOCALE = "C";
