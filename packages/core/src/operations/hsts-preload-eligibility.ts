import type { HstsPreloadIssue } from "./hsts-preload-issue.ts";

export type HstsPreloadEligibility = {
  /** Errors block submission entirely: it must be empty for the domain to be accepted. */
  errors: HstsPreloadIssue[];
  /** True when `errors` is empty: the domain meets the preload requirements now. */
  ok: boolean;
  /** Non-blocking but worth reviewing, such as a www subdomain that does not redirect. */
  warnings: HstsPreloadIssue[];
};
