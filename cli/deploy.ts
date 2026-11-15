import { assertNotUnderTest } from "../src/assert-not-under-test.ts";
import { deploy } from "../src/deploy/deploy.ts";
import { parseDeployArgs } from "../src/deploy/parse-deploy-args.ts";
import { realDeployIo } from "../src/deploy/real-deploy-io.ts";
import { env } from "../src/env.ts";
import { FAILURE_EXIT } from "../src/failure-exit.constants.ts";
import { repoRoot } from "../src/repo-root.ts";
import { USAGE_EXIT } from "../src/usage-exit.constants.ts";
import { loadWorkers } from "../src/workers/load-workers.ts";
import { resolveWorkers } from "../src/workers/resolve-workers.ts";
import { workerAt } from "../src/workers/worker-at.ts";

const USAGE = "usage: infra deploy [worker...] --scope dev|prod [--prune]";

function fail(message: string): number {
  process.stderr.write(`infra deploy: ${message}\n`);

  return FAILURE_EXIT;
}

export async function main(args: readonly string[]): Promise<number> {
  const parsed = parseDeployArgs(args);

  if (parsed === undefined) {
    process.stderr.write(`${USAGE}\n`);

    return USAGE_EXIT;
  }

  try {
    assertNotUnderTest(env);

    const root = repoRoot(process.cwd());
    const catalog = await loadWorkers(root);
    const { scope, selectors } = parsed;

    const picked =
      selectors.length === 0 ? workerAt(catalog, process.cwd(), scope) : resolveWorkers(catalog, selectors, scope);

    if (!picked.ok) return fail(picked.error);

    return await deploy({ prune: parsed.prune, scope, targets: picked.targets }, realDeployIo(root));
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
