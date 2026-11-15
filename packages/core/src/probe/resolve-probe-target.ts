import { parseProbeArgs } from "./parse-probe-args.ts";
import { parseProbeTarget } from "./parse-probe-target.ts";
import type { ProbeIo } from "./probe-io.ts";
import type { ProbeResolution } from "./probe-resolution.ts";
import { HOST_PROMPT } from "./probe.constants.ts";

/** The host from the args, or from the prompt on a terminal; no host and no terminal is a usage error. */
export async function resolveProbeTarget(args: readonly string[], io: ProbeIo): Promise<ProbeResolution> {
  const parsed = parseProbeArgs(args);

  if (parsed.kind === "help" || parsed.kind === "usage") return parsed;

  if (parsed.kind === "ask" && !io.isTTY) return { kind: "usage" };

  try {
    const raw = parsed.kind === "host" ? parsed.raw : await io.question(HOST_PROMPT);

    return { kind: "target", target: parseProbeTarget(raw) };
  } catch (error) {
    return { kind: "error", message: error instanceof Error ? error.message : String(error) };
  }
}
