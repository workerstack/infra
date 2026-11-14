import type { CfClient } from "../api/client.ts";
import type { InfraEnv } from "../schema/infra.ts";
import type { Log } from "../shared/log.ts";

/** What every command reaches Cloudflare through: a client for the env's account and a zone, and the log. */
export type ClientDeps = {
  client: (env: InfraEnv, zoneId: string) => CfClient;
  log: Log;
};
