import { runCfGen } from "../cf-config/run-cf-gen.ts";
import type { InfraScope } from "../schema/infra.ts";
import type { Log } from "../shared/log.ts";
import { CHECK_FLAG, GEN_USAGE_FLAGS } from "./check-flag.constants.ts";
import type { CommandHost } from "./command-host.ts";
import { runCommand } from "./run-command.ts";

/** What `infra gen` runs, swapped by a test: how it types a written package, and where it prints. */
export type GenDeps = { log: Log; runTypes: (dir: string, scope: InfraScope) => Promise<void> };

/** `infra gen [name|--all] [--check]`: generates each picked product's Worker configs; `--check` reports drift. */
export function runGen(args: readonly string[], host: CommandHost, deps: GenDeps): Promise<number> {
  const check = args.includes(CHECK_FLAG);

  return runCommand(
    {
      name: "gen",
      usageFlags: GEN_USAGE_FLAGS,
      work: (product) => runCfGen({ check, log: deps.log, product, runTypes: deps.runTypes }),
    },
    args.filter((arg) => arg !== CHECK_FLAG),
    host,
  );
}
