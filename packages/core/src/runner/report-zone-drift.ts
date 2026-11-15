import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { reportDrift } from "./report-drift.ts";
import type { ZoneVerifyResult } from "./zone-verify-result.ts";

/** Prints the drift of the transform rules, Cloud Connector rules and disabled worker routes. */
export function reportZoneDrift(result: ZoneVerifyResult, log: Log = stdoutLog): void {
  reportDrift(
    result.transforms,
    { format: (rule) => `${rule.description} :: ${rule.expression} → ${rule.pathExpression}`, label: "Transforms" },
    log,
  );
  reportDrift(
    result.cloudConnectors,
    {
      format: (rule) => `${rule.description} :: ${rule.expression} → ${rule.host} (${rule.provider})`,
      label: "Cloud Connectors",
    },
    log,
  );
  reportDrift(result.disabledWorkerRoutes, { format: (route) => route, label: "Disabled Worker Routes" }, log);
}
