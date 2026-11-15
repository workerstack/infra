import { FAILURE_EXIT } from "../failure-exit.constants.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { USAGE_EXIT } from "../usage-exit.constants.ts";
import { resolveWorkers } from "../workers/resolve-workers.ts";
import type { WorkerTarget } from "../workers/worker-target.ts";
import type { ObservabilityHost } from "./observability-host.ts";
import { parseSyncArgs } from "./parse-sync-args.ts";
import type { SyncContext } from "./sync-context.ts";
import { syncTarget } from "./sync-target.ts";

async function syncAll(targets: WorkerTarget[], ctx: SyncContext): Promise<number> {
  const drifted: boolean[] = [];

  await runInOrder(targets, async (target) => {
    try {
      drifted.push(await syncTarget(target, ctx));
    } catch (error) {
      ctx.stderr(
        `infra observability-sync: ${target.scriptName}: ${error instanceof Error ? error.message : String(error)}`,
      );
      drifted.push(true);
    }
  });

  return drifted.includes(true) ? FAILURE_EXIT : 0;
}

/**
 * `infra observability-sync <worker>... [--scope prod|dev] [--apply]`: reports each Worker's `observability` drift
 * from the live script; `--apply` PATCHes the settings. Exits 2 for bad args, 1 for drift or a failure, else 0.
 */
export async function runObservabilitySync(args: readonly string[], host: ObservabilityHost): Promise<number> {
  const parsed = parseSyncArgs(args);

  if (!parsed.ok) {
    host.stderr(parsed.message);

    return USAGE_EXIT;
  }

  try {
    host.guard();

    const catalog = await host.load(host.root(host.cwd));
    const resolved = resolveWorkers(catalog, parsed.selectors, parsed.scope);

    if (!resolved.ok) {
      host.stderr(resolved.error);

      return FAILURE_EXIT;
    }

    return await syncAll(resolved.targets, {
      apply: parsed.apply,
      fetcher: host.fetcher,
      stderr: host.stderr,
      stdout: host.stdout,
    });
  } catch (error) {
    host.stderr(`infra observability-sync: ${error instanceof Error ? error.message : String(error)}`);

    return FAILURE_EXIT;
  }
}
