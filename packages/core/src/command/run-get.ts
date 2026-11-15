import type { CommandHost } from "./command-host.ts";
import type { GetDeps } from "./get-deps.ts";
import { getProduct } from "./get-product.ts";
import { runCommand } from "./run-command.ts";

/** `infra get`: verifies each picked product against its live accounts; resolves to the exit code. */
export function runGet(args: readonly string[], host: CommandHost, deps: GetDeps): Promise<number> {
  return runCommand(
    { done: "\n Verification complete.", name: "get", work: (product) => getProduct(deps, product) },
    args,
    host,
  );
}
