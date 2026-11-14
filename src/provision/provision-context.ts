import type { Log } from "../shared/log.ts";

/** Where a binding is provisioned: the account, the zone, the env name its lines are tagged with, and the log. */
export type ProvisionContext = { accountId: string; env: string; log: Log; zoneId: string };
