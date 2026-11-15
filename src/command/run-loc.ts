import { runCfGen } from "../cf-config/run-cf-gen.ts";
import { parseLocArgs } from "../local/parse-loc-args.ts";
import { productStack } from "../local/product-stack.ts";
import { runStack } from "../local/run-stack.ts";
import type { Log } from "../shared/log.ts";
import { USAGE_EXIT } from "../usage-exit.constants.ts";
import type { CommandHost } from "./command-host.ts";
import { LOC_USAGE } from "./loc-usage.constants.ts";
import { runCommand } from "./run-command.ts";

/** What `infra loc` runs through: where it prints, and the promise that stops the stack (Ctrl-C, SIGTERM). */
export type LocDeps = { log: Log; stopSignal: Promise<void> };

/**
 * `infra loc [name] [--only dir,...] [--with dir,...]`: runs the product's local stack until `stopSignal`, after
 * `infra gen` wrote its Worker configs for the stack's origin. Resolves to 2 for bad args, 1 for any refusal.
 */
export function runLoc(args: readonly string[], host: CommandHost, deps: LocDeps): Promise<number> {
  const parsed = parseLocArgs(args);

  if (parsed === undefined) {
    host.stderr(LOC_USAGE);

    return Promise.resolve(USAGE_EXIT);
  }

  return runCommand(
    {
      name: "loc",
      work: async (product) => {
        const local = product.config.local;

        if (local === undefined) throw new Error("no local block in its infra config, so it has no local stack");

        const stack = await productStack(product, parsed.choice);
        // No `cf` types: they only matter to the editor.

        async function prepare(): Promise<void> {
          await runCfGen({ check: false, log: deps.log, product, runTypes: async () => {} });
        }

        await runStack(
          { ...stack, host: local.host, prepare, product: product.name, productRoot: product.root },
          deps.stopSignal,
          deps.log,
        );
      },
    },
    parsed.positionals,
    host,
  );
}
