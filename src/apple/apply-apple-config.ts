import { requiredScoped } from "../credentials.ts";
import type { InfraScope } from "../schema/infra.ts";
import { INFRA_SCOPES } from "../shared/infra-scopes.constants.ts";
import type { Log } from "../shared/log.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import type { AppleTarget } from "./apple-target.ts";
import { generateAppleClientSecret } from "./generate-apple-client-secret.ts";

/** Prints each scope's Apple wiring and proves its `APPLE_PRIVATE_KEY` signs a client secret. */
export async function applyAppleConfig(target: AppleTarget): Promise<void> {
  const log = target.log ?? stdoutLog;

  if (target.config.oauth === undefined) return;

  log("  OAuth:");
  await runInOrder([...INFRA_SCOPES], (scope) => applyScope(target, scope, log));
}

async function applyScope(target: AppleTarget, scope: InfraScope, log: Log): Promise<void> {
  const oauth = target.config.oauth?.[scope];

  if (oauth === undefined) return;

  log(`    [${scope}] Service ID: ${oauth.serviceId}`);
  log(`    [${scope}] Team ID: ${oauth.teamId}`);
  log(`    [${scope}] Key ID: ${oauth.keyId}`);
  log(`    [${scope}] Redirect origins: ${oauth.redirectOrigins.join(", ")}`);

  const privateKey = requiredScoped(target.env, scope, "APPLE_PRIVATE_KEY");

  try {
    await generateAppleClientSecret({ ...oauth, privateKey });
    log(`    [${scope}] Client secret JWT: ✓ (key valid)`);
  } catch (error) {
    log(`    [${scope}] Client secret JWT: ✗ ${error instanceof Error ? error.message : "failed"}`);
  }
}
