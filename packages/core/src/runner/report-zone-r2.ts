import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { r2BucketLines } from "./r2-bucket-lines.ts";
import type { R2EnvVerification } from "./r2-env-verification.ts";

/** Prints each env's R2 buckets with the plain location, as `zone-get` shows them. */
export function reportZoneR2(results: R2EnvVerification[], log: Log = stdoutLog): void {
  log("  R2 Buckets:");

  for (const result of results) {
    log(`    [${result.env}]:`);

    for (const bucket of result.buckets)
      for (const line of r2BucketLines(bucket, `        Location: ${bucket.location ?? "unknown"}`)) log(line);
  }
}
