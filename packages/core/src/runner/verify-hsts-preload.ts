import type { CfFetch } from "../api/cf-fetch.ts";
import { checkHstsPreloadEligibility } from "../operations/check-hsts-preload-eligibility.ts";
import { getHstsPreloadStatus } from "../operations/get-hsts-preload-status.ts";
import type { HstsPreloadEligibility } from "../operations/hsts-preload-eligibility.ts";
import type { HstsPreloadStatusResult } from "../operations/hsts-preload-status-result.ts";

export type HstsPreloadVerification = {
  eligibility: HstsPreloadEligibility;
  status: HstsPreloadStatusResult;
};

/**
 * Verifies the preload-list state of a domain with two independent checks: whether hstspreload.org's live header
 * check accepts it, and whether it is already in the Chromium preload list. Both hit a third-party origin, so
 * callers should expect network failures.
 */
export async function verifyHstsPreload(domain: string, fetcher: CfFetch = fetch): Promise<HstsPreloadVerification> {
  const [eligibility, status] = await Promise.all([
    checkHstsPreloadEligibility(domain, fetcher),
    getHstsPreloadStatus(domain, fetcher),
  ]);

  return { eligibility, status };
}
