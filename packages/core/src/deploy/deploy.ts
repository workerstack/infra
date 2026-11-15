import { FAILURE_EXIT } from "../failure-exit.constants.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import type { DeployIo } from "./deploy-io.ts";
import type { DeployRequest } from "./deploy-request.ts";
import { deployWorker } from "./deploy-worker.ts";

/**
 * Deploys each Worker in order. A Worker that fails prints `infra deploy: <dir>: <message>` and the rest still
 * deploy; the exit is 1 if any failed, else 0.
 */
export async function deploy(request: DeployRequest, io: DeployIo): Promise<number> {
  let failed = 0;

  await runInOrder(request.targets, async (target) => {
    try {
      await deployWorker(target, request, io);
    } catch (error) {
      io.error(`infra deploy: ${target.worker.dir}: ${error instanceof Error ? error.message : String(error)}`);
      failed += 1;
    }
  });

  return failed === 0 ? 0 : FAILURE_EXIT;
}
