import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { DnsVerifyResult } from "../zone/dns-types.ts";

/** Prints the DNS comparison: counts, missing and undeclared records, the DNSSEC status and its DS record. */
export function reportDns(result: DnsVerifyResult, log: Log = stdoutLog): void {
  log("  DNS Records:");
  log(`    Declared: ${result.declared}  Live: ${result.live}`);

  if (result.missing.length > 0) {
    log(`    Missing (${result.missing.length}):`);

    for (const record of result.missing) log(`      ✗ ${record.type} ${record.name} → ${record.content}`);
  } else {
    log("    All declared records found ✓");
  }

  if (result.undeclared.length > 0) {
    log(`    Undeclared (${result.undeclared.length}):`);

    for (const record of result.undeclared) log(`      ⚠ ${record.type} ${record.name} → ${record.content}`);
  }

  log(`    DNSSEC: ${result.dnssec.status}`);

  if (result.dnssec.dsRecord !== undefined && result.dnssec.dsRecord !== "")
    log(`    DS Record: ${result.dnssec.dsRecord}`);
}
