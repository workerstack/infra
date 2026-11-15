import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { AiSearchVerification } from "./ai-search-verification.ts";

/** Prints each declared AI Search instance with its model and live status, or `(none declared)`. */
export function reportAiSearch(results: AiSearchVerification[], log: Log = stdoutLog): void {
  log("  AI Search:");

  if (results.length === 0) log("    (none declared)");

  for (const instance of results) {
    const mark = instance.exists ? "✓" : "⚠ MISSING";
    const status = instance.status === undefined || instance.status === "" ? "" : ` [status: ${instance.status}]`;

    log(`    [${instance.env}] ${instance.instanceName} (${instance.embeddingModel}) — ${mark}${status}`);
  }
}
