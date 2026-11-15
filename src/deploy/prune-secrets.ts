import { runInOrder } from "../shared/run-in-order.ts";
import type { WorkerTarget } from "../workers/worker-target.ts";
import { assertExit } from "./assert-exit.ts";
import type { DeployRun } from "./deploy-run.ts";
import { parseSecretList } from "./parse-secret-list.ts";

/**
 * Names the Worker's secrets its config no longer declares, and deletes them when the deploy was asked to prune.
 * `declared` is the names of the secrets just uploaded.
 */
export async function pruneSecrets(target: WorkerTarget, declared: string[], run: DeployRun): Promise<void> {
  const { io, child, scope } = run;
  const { dir } = target.worker;
  const name = ["--name", target.scriptName];
  const listed = await io.run("wrangler", ["secret", "list", ...name], child);

  assertExit("wrangler secret list", listed.code);

  const stale = parseSecretList(listed.stdout)
    .filter((secret) => !declared.includes(secret))
    .toSorted();

  if (stale.length === 0) return;

  if (!run.prune) {
    io.print(
      `${dir} --scope ${scope} still has secrets its cloudflare.config.ts does not declare: ${stale.join(", ")}. ` +
        "Run again with --prune to delete them.",
    );

    return;
  }

  await runInOrder(stale, async (secret) => {
    const deleted = await io.run("wrangler", ["secret", "delete", secret, ...name], child);

    assertExit("wrangler secret delete", deleted.code);
    io.print(`Deleted secret ${secret} from ${dir} --scope ${scope}.`);
  });
}
