import type { ProbeArgs } from "./probe-args.ts";
import { HELP_FLAGS } from "./probe.constants.ts";

/** `[host]`, with a stray `--` dropped and `-h` for help; a flag or a second host is a usage error. */
export function parseProbeArgs(args: readonly string[]): ProbeArgs {
  const tokens = args.filter((arg) => arg !== "--");

  if (tokens.some((arg) => HELP_FLAGS.includes(arg))) return { kind: "help" };

  if (tokens.some((arg) => arg.startsWith("-")) || tokens.length > 1) return { kind: "usage" };

  const [raw] = tokens;

  return raw === undefined || raw === "" ? { kind: "ask" } : { kind: "host", raw };
}
