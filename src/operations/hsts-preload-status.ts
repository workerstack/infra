import type { HSTS_PRELOAD_STATUSES } from "./hsts-preload-statuses.constants.ts";

/** A domain's place on the Chromium preload list. */
export type HstsPreloadStatus = (typeof HSTS_PRELOAD_STATUSES)[number];
