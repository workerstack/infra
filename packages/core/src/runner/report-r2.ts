import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { r2BucketLines } from "./r2-bucket-lines.ts";
import type { R2EnvVerification } from "./r2-env-verification.ts";

/** Prints each env's R2 buckets with the location checked against its hint (`✓` or `✗ drift`). */
export function reportR2(results: R2EnvVerification[], log: Log = stdoutLog): void {
  log("  R2 Buckets:");

  for (const result of results) {
    log(`    [${result.env}]:`);

    for (const bucket of result.buckets) {
      const status = bucket.locationMatches ? "✓" : `✗ drift (expected ${bucket.locationHint ?? "?"})`;
      const location = `        Location: ${bucket.location ?? "unknown"} ${status}`;

      for (const line of r2BucketLines(bucket, location)) log(line);
    }
  }
}
