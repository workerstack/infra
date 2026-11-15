import type { HstsPreloadStatus } from "./hsts-preload-status.ts";

/**
 * The CF-verifiable status of the apex domain against the Chromium preload list.
 * `preloaded` is shipped in Chromium source, `pending` is queued for the next Chrome release, `rejected`
 * failed submission (see `message`) and `unknown` was never submitted or is not tracked.
 */
export type HstsPreloadStatusResult = {
  /** Raw message from hstspreload.org when the status is `rejected`. */
  message?: string | undefined;
  status: HstsPreloadStatus;
};
