import type { CfFetch } from "../api/cf-fetch.ts";
import { getHstsPreloadStatus } from "../operations/get-hsts-preload-status.ts";
import type { HstsPreloadStatusResult } from "../operations/hsts-preload-status-result.ts";
import { hstsPreloadSubmissionUrl } from "../operations/hsts-preload-submission-url.ts";
import type { Log } from "../shared/log.ts";

function logStatus(log: Log, domain: string, result: HstsPreloadStatusResult): void {
  const url = hstsPreloadSubmissionUrl(domain);

  if (result.status === "preloaded") {
    log(`  HSTS preload: ${domain} is preloaded in Chromium`);
  } else if (result.status === "pending") {
    log(`  HSTS preload: ${domain} is queued, awaiting next Chrome release`);
  } else if (result.status === "rejected") {
    log(`  ⚠ HSTS preload rejected for ${domain}: ${result.message ?? "no reason given"}`);
    log(`    Resubmit at ${url}`);
  } else {
    log(`  ⚠ HSTS preload: ${domain} not submitted`);
    log(`    Submit manually at ${url}`);
  }
}

/**
 * Prints where the domain stands on the Chromium preload list. Submission is manual (reCAPTCHA-gated), so this
 * tells the operator whether a human step is outstanding. A failed check is printed, never thrown.
 */
export async function reportHstsPreloadStatus(log: Log, domain: string, fetcher: CfFetch = fetch): Promise<void> {
  try {
    logStatus(log, domain, await getHstsPreloadStatus(domain, fetcher));
  } catch (error) {
    log(`  ⚠ HSTS preload status check failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
