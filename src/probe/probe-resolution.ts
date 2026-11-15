import type { ProbeTarget } from "./probe-target.ts";

/** The host to probe, or why there is none. */
export type ProbeResolution =
  | { kind: "help" }
  | { kind: "usage" }
  | { kind: "error"; message: string }
  | { kind: "target"; target: ProbeTarget };
