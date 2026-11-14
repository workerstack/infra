import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { TurnstileVerification } from "./turnstile-verification.ts";

/** Prints each live widget on one line; `undefined` means none is declared. */
export function reportZoneTurnstile(results: TurnstileVerification[] | undefined, log: Log = stdoutLog): void {
  log("  Turnstile:");

  if (results === undefined) {
    log("    (none declared)");

    return;
  }

  if (results.length === 0) log("    ⚠ no widgets found on CF for declared sitekeys");

  for (const widget of results) {
    const heading = `    [${widget.env}] ${widget.name} (${widget.sitekey})`;

    log(`${heading} mode=${widget.mode} clearance=${widget.clearanceLevel}`);
    log(`      domains: ${widget.domains.join(", ")}`);
  }
}
