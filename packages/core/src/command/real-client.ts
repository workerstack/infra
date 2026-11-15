import { accountAuth } from "../api/auth.ts";
import { createClient } from "../api/client.ts";
import type { CfClient } from "../api/client.ts";
import type { InfraEnv } from "../schema/infra.ts";

/** A client for `zoneId` signed with the env's account credentials, read now. */
export function realClient(env: InfraEnv, zoneId: string): CfClient {
  return createClient(accountAuth(env), zoneId);
}
