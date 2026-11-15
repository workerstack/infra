import type { IndexNowTarget } from "./index-now-target.ts";

/** The URL the product serves its IndexNow key at. */
export function keyFileUrl(target: IndexNowTarget): string {
  return `https://${target.host}/${target.config.key}.txt`;
}
