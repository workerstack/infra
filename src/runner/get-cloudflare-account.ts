import type { CfClient } from "../api/client.ts";
import type { Log } from "../shared/log.ts";
import type { CloudflareTarget } from "./cloudflare-target.ts";
import { reportAccess } from "./report-access.ts";
import { reportBindings } from "./report-bindings.ts";
import { reportR2Credentials } from "./report-r2-credentials.ts";
import { reportR2 } from "./report-r2.ts";
import { reportTurnstile } from "./report-turnstile.ts";
import { verifyAccessConfig } from "./verify-access-config.ts";
import { verifyBindings } from "./verify-bindings.ts";
import { verifyR2Config } from "./verify-r2-config.ts";
import { verifyR2Credentials } from "./verify-r2-credentials.ts";
import { verifyTurnstileConfig } from "./verify-turnstile-config.ts";

/** Verifies and prints the account side of a product: bindings, R2, Turnstile and Access. */
export async function getCloudflareAccount(client: CfClient, target: CloudflareTarget, log: Log): Promise<void> {
  const { accountId, config, env } = target;

  reportBindings(await verifyBindings(client, accountId, config.bindings), log);

  if (config.r2 !== undefined) reportR2Credentials(verifyR2Credentials(config.r2, env), log);

  reportR2(await verifyR2Config(client, accountId, config.bindings), log);

  if (config.turnstile !== undefined)
    reportTurnstile(await verifyTurnstileConfig(client, accountId, config.turnstile), log);

  if (config.access !== undefined) reportAccess(await verifyAccessConfig(client, accountId, config.access), log);
}
