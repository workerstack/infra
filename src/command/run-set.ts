import type { CommandHost } from "./command-host.ts";
import { runCommand } from "./run-command.ts";
import type { SetDeps } from "./set-deps.ts";
import { setProduct } from "./set-product.ts";

/** `infra set`: provisions and applies each product; ids go to the config, secrets to `bun repo env set`. */
export function runSet(args: readonly string[], host: CommandHost, deps: SetDeps): Promise<number> {
  return runCommand(
    {
      done: "\n All configured. Run infra get to verify.",
      name: "set",
      work: (product, root) => setProduct(deps, product, root),
    },
    args,
    host,
  );
}
