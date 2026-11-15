/** What the command line asked: help, a host, to be asked for one, or bad arguments. */
export type ProbeArgs = { kind: "help" } | { kind: "usage" } | { kind: "host"; raw: string } | { kind: "ask" };
