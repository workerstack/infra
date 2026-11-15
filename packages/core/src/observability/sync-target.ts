import { accountAuth } from "../api/auth.ts";
import { cloudflareCredentials } from "../credentials.ts";
import type { WorkerTarget } from "../workers/worker-target.ts";
import { observabilityDrift } from "./observability-drift.ts";
import { scriptSettings } from "./script-settings.ts";
import type { SyncContext } from "./sync-context.ts";

/** Compares one Worker's `observability` with the live script and, with `apply`, writes it. True when it drifted. */
export async function syncTarget(target: WorkerTarget, ctx: SyncContext): Promise<boolean> {
  const { scriptName } = target;
  const desired = target.observability;

  if (desired === undefined) {
    ctx.stderr(`${scriptName}: its config has no observability block`);

    return true;
  }

  const { env } = target.worker.product.config;
  const call = { accountId: cloudflareCredentials(env).accountId, auth: accountAuth(env), script: scriptName };
  const drift = observabilityDrift(desired, await scriptSettings(call, ctx.fetcher));

  if (drift.length === 0) {
    ctx.stdout(`${scriptName}: in sync`);

    return false;
  }

  if (!ctx.apply) {
    ctx.stdout(`${scriptName}: drift\n  ${drift.join("\n  ")}`);

    return true;
  }

  const left = observabilityDrift(desired, await scriptSettings({ ...call, observability: desired }, ctx.fetcher));

  if (left.length === 0) {
    ctx.stdout(`${scriptName}: applied (${drift.length} fields)`);

    return false;
  }

  ctx.stderr(`${scriptName}: still drifted after PATCH\n  ${left.join("\n  ")}`);

  return true;
}
