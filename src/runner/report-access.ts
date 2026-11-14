import type { Log } from "../shared/log.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { accessApplicationLines } from "./access-application-lines.ts";
import type { AccessEnvVerification } from "./access-env-verification.ts";
import { accessScopeLines } from "./access-scope-lines.ts";

/** Prints each scope's Access organization, Google IdP, service token and applications with their drift. */
export function reportAccess(results: AccessEnvVerification[], log: Log = stdoutLog): void {
  for (const result of results) {
    for (const text of accessScopeLines(result)) log(text);

    if (result.applications.length === 0) continue;

    log("    Applications:");

    for (const app of result.applications) for (const text of accessApplicationLines(app)) log(text);
  }
}
