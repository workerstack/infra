import { realClient } from "../src/command/real-client.ts";
import { realHost } from "../src/command/real-host.ts";
import { runZoneGet } from "../src/command/run-zone-get.ts";
import { zoneGet } from "../src/runner/zone-get.ts";
import { stdoutLog } from "../src/shared/stdout-log.ts";

export function main(args: readonly string[]): Promise<number> {
  return runZoneGet(args, realHost(), { client: realClient, log: stdoutLog, zoneGet });
}
