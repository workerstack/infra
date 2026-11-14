import * as z from "zod";

import type { CfFetch } from "../api/cf-fetch.ts";
import type { HstsPreloadEligibility } from "./hsts-preload-eligibility.ts";
import { hstspreloadFailure } from "./hsts-preload-failure.ts";
import type { HstsPreloadIssue } from "./hsts-preload-issue.ts";
import { HSTSPRELOAD_API } from "./hstspreload-api.constants.ts";

function issuesSchema(): z.ZodType<{ errors: HstsPreloadIssue[]; warnings: HstsPreloadIssue[] }> {
  const issue = z.object({ code: z.string(), message: z.string(), summary: z.string() });

  return z.object({ errors: z.array(issue), warnings: z.array(issue) });
}

/**
 * Runs hstspreload.org's live check against the domain's current response headers. Run it after applying
 * the HSTS header so the remote check sees the right state.
 */
export async function checkHstsPreloadEligibility(
  domain: string,
  fetcher: CfFetch = fetch,
): Promise<HstsPreloadEligibility> {
  const response = await fetcher(`${HSTSPRELOAD_API}/preloadable?domain=${encodeURIComponent(domain)}`, {});

  if (!response.ok) throw hstspreloadFailure("preloadable", response);

  const body = issuesSchema().parse(await response.json());

  return { errors: body.errors, ok: body.errors.length === 0, warnings: body.warnings };
}
