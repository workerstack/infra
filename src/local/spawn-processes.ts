import { runInOrder } from "../shared/run-in-order.ts";
import { spawnApp } from "./spawn-app.ts";
import type { SpawnContext } from "./spawn-context.ts";
import { spawnWorkers } from "./spawn-workers.ts";
import type { StackMember } from "./stack-candidate.ts";
import type { StackProcess } from "./stack-options.ts";

/** Starts the stack's processes one after another: the shared `wrangler dev` when it has Workers, then each app. */
export async function spawnProcesses(members: readonly StackMember[], context: SpawnContext): Promise<StackProcess[]> {
  const workers = members.filter((member) => member.kind === "worker");
  const processes: StackProcess[] = workers.length > 0 ? [await spawnWorkers(workers, context)] : [];

  await runInOrder(
    members.filter((member) => member.kind === "app"),
    async (app) => {
      processes.push(await spawnApp(app, context));
    },
  );

  return processes;
}
