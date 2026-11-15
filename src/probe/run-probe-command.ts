import { FAILURE_EXIT } from "../failure-exit.constants.ts";
import { USAGE_EXIT } from "../usage-exit.constants.ts";
import { formatProbe } from "./format-probe.ts";
import type { ProbeDeps } from "./probe-deps.ts";
import { PROBE_HELP, PROBE_USAGE } from "./probe.constants.ts";
import { resolveProbeTarget } from "./resolve-probe-target.ts";
import { runProbe } from "./run-probe.ts";

/**
 * `infra probe [host]`: prints the ALPN, HTTP/1.1, HTTP/2 and HTTP/3 report. Asks for the host on a terminal when
 * none is given. Exits 2 for bad args, 1 for a bad host or when no probe got an answer, else 0.
 */
export async function runProbeCommand(args: readonly string[], deps: ProbeDeps): Promise<number> {
  const { io } = deps;
  const resolved = await resolveProbeTarget(args, io);

  if (resolved.kind === "help") {
    for (const line of PROBE_HELP) io.log(line);

    return 0;
  }

  if (resolved.kind === "usage") {
    io.error(PROBE_USAGE);

    return USAGE_EXIT;
  }

  if (resolved.kind === "error") {
    io.error(resolved.message);

    return FAILURE_EXIT;
  }

  try {
    const result = await runProbe(resolved.target, deps.spawnText);

    io.log(formatProbe(result));

    return result.alpnAccepted === null && result.http11.kind === "error" && result.http2.kind === "error"
      ? FAILURE_EXIT
      : 0;
  } catch (error) {
    io.error(error instanceof Error ? error.message : String(error));

    return FAILURE_EXIT;
  }
}
