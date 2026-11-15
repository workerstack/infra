import { FAILURE_EXIT } from "../failure-exit.constants.ts";
import { USAGE_EXIT } from "../usage-exit.constants.ts";
import type { DeployScope } from "../workers/deploy-scope.ts";
import type { WorkerTarget } from "../workers/worker-target.ts";
import type { LogsHost } from "./logs-host.ts";
import type { ParseResult } from "./parse-result.ts";
import { pickTargets } from "./pick-targets.ts";

/** What a logs command does: read its arguments, then work on the Workers they name. */
export type LogsCommand<A extends { scope: DeployScope; selectors: string[] }> = {
  name: string;
  parse: (args: readonly string[]) => ParseResult<A>;
  usage: readonly string[];
  work: (run: { args: A; root: string; targets: WorkerTarget[] }) => Promise<number>;
};

/**
 * Prints the usage for help (exit 0) or a bad argument (exit 2); else runs the guard, picks the Workers and
 * works on them. A selector that matches nothing prints the known Workers and exits 1, as does a thrown error.
 */
export async function runLogsCommand<A extends { scope: DeployScope; selectors: string[] }>(
  command: LogsCommand<A>,
  args: readonly string[],
  host: LogsHost,
): Promise<number> {
  const parsed = command.parse(args);

  if (parsed.kind === "help") {
    host.stdout(command.usage.join("\n"));

    return 0;
  }

  if (parsed.kind === "error") {
    host.stderr(`${parsed.message}\n${command.usage.join("\n")}`);

    return USAGE_EXIT;
  }

  try {
    const picked = await pickTargets(host, parsed.args.selectors, parsed.args.scope);

    if (!picked.ok) {
      host.stderr(picked.error);

      return FAILURE_EXIT;
    }

    return await command.work({ args: parsed.args, root: host.root(host.cwd), targets: picked.targets });
  } catch (error) {
    host.stderr(`infra ${command.name}: ${error instanceof Error ? error.message : String(error)}`);

    return FAILURE_EXIT;
  }
}
