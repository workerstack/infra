import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { reportRules } from "./report-rules.ts";
import { reportSettings } from "./report-settings.ts";
import type { ZoneVerifyResult } from "./zone-verify-result.ts";

/** Prints the live WAF, rate limit, redirect and cache rules, then the zone settings. */
export function reportZoneRules(result: ZoneVerifyResult, log: Log = stdoutLog): void {
  reportRules("WAF Custom Rules", result.waf, log);
  reportRules("Rate Limiting", result.rateLimit, log);
  reportRules("Redirect Rules", result.redirects, log);
  reportRules("Cache Rules", result.cache, log);
  reportSettings(result.settings, log);
}
