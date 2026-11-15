import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { TurnstileVerification } from "./turnstile-verification.ts";

/** Prints each live Turnstile widget, or `(no provisioned widgets)`. */
export function reportTurnstile(results: TurnstileVerification[], log: Log = stdoutLog): void {
  log("  Turnstile:");

  for (const widget of results) {
    log(`    [${widget.env}] ${widget.name} (${widget.sitekey}):`);
    log(`      Mode: ${widget.mode}`);
    log(`      Clearance: ${widget.clearanceLevel}`);
    log(`      Domains: ${widget.domains.join(", ")}`);
  }

  if (results.length === 0) log("    (no provisioned widgets)");
}
