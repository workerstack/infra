import type { CfClient } from "../api/client.ts";
import type { ZoneConfig } from "../schema/zone.ts";
import type { Log } from "../shared/log.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { stdoutLog } from "../shared/stdout-log.ts";

type CfWorkerRoute = { id: string; pattern: string; script?: null | string };

// Bypass = no worker handles the route. CF surfaces null or undefined for
// "no worker" depending on the SDK version; both mean the same thing.
function isBypass(route: CfWorkerRoute): boolean {
  return route.script === null || route.script === undefined;
}

function listRoutes(client: CfClient): Promise<CfWorkerRoute[]> {
  return client.request<CfWorkerRoute[]>("GET", `/zones/${client.zoneId}/workers/routes`);
}

/** Returns the patterns of bypass routes only; wrangler-deployed workers are excluded. */
export async function getDisabledWorkerRoutes(client: CfClient): Promise<string[]> {
  const routes = await listRoutes(client);

  return routes.filter(isBypass).map((route) => route.pattern);
}

/**
 * Upserts routes declared with `script: null`, so a catch-all worker does not
 * intercept those paths and they fall through to Cloud Connector or the origin.
 *
 * Orphan bypass routes (live bypass, not declared) are deleted. Routes with a
 * real script are never touched. Idempotent: a declared pattern that is
 * already null is left alone.
 */
export async function setDisabledWorkerRoutes(
  client: CfClient,
  config: ZoneConfig,
  log: Log = stdoutLog,
): Promise<void> {
  const declared = new Set(config.disabledWorkerRoutes);
  const existing = await listRoutes(client);

  const orphans = existing.filter((route) => isBypass(route) && !declared.has(route.pattern));

  await runInOrder(orphans, async (route) => {
    log(`  → deleting orphan bypass route: ${route.pattern}`);
    await client.request("DELETE", `/zones/${client.zoneId}/workers/routes/${route.id}`);
  });

  await runInOrder(config.disabledWorkerRoutes, async (pattern) => {
    const match = existing.find((route) => route.pattern === pattern);

    if (match === undefined)
      await client.request("POST", `/zones/${client.zoneId}/workers/routes`, { pattern, script: null });
    else if (!isBypass(match))
      await client.request("PUT", `/zones/${client.zoneId}/workers/routes/${match.id}`, { pattern, script: null });
  });
}
