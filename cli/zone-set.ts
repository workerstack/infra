import { realClient } from "../src/command/real-client.ts";
import { realHost } from "../src/command/real-host.ts";
import { runZoneSet } from "../src/command/run-zone-set.ts";
import { applyZoneConfig } from "../src/runner/apply-zone-config.ts";
import { stdoutLog } from "../src/shared/stdout-log.ts";

export function main(args: readonly string[]): Promise<number> {
  return runZoneSet(args, realHost(), { applyZoneConfig, client: realClient, log: stdoutLog });
}
