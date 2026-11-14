import * as z from "zod";

import type { CfFetch } from "../api/cf-fetch.ts";
import { hstspreloadFailure } from "./hsts-preload-failure.ts";
import type { HstsPreloadStatusResult } from "./hsts-preload-status-result.ts";
import type { HstsPreloadStatus } from "./hsts-preload-status.ts";
import { HSTS_PRELOAD_STATUSES } from "./hsts-preload-statuses.constants.ts";
import { HSTSPRELOAD_API } from "./hstspreload-api.constants.ts";

function statusBodySchema(): z.ZodType<{ message?: string | undefined; status: string }> {
  return z.object({ message: z.string().optional(), status: z.string() });
}

function knownStatus(status: string): HstsPreloadStatus {
  return HSTS_PRELOAD_STATUSES.find((known) => known === status) ?? "unknown";
}

/** The domain's preload-list status, to tell whether the manual submission was done in an earlier run. */
export async function getHstsPreloadStatus(domain: string, fetcher: CfFetch = fetch): Promise<HstsPreloadStatusResult> {
  const response = await fetcher(`${HSTSPRELOAD_API}/status?domain=${encodeURIComponent(domain)}`, {});

  if (!response.ok) throw hstspreloadFailure("status", response);

  const body = statusBodySchema().parse(await response.json());

  return { message: body.message, status: knownStatus(body.status) };
}
