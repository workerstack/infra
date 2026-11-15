import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { IndexNowVerifyResult } from "./index-now-verify-result.ts";

/** Prints the IndexNow check: the key file, then how many URLs the sitemaps hold. */
export function reportIndexNow(result: IndexNowVerifyResult, log: Log = stdoutLog): void {
  log(`  Key file ${result.keyFile}: ${result.keyServed ? "served ✓" : "not served ✗"}`);
  log(`  Sitemap URLs: ${String(result.urlCount)}`);
}
