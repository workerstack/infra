import { FAILURE_EXIT } from "../failure-exit.constants.ts";
import type { Product } from "../products.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { USAGE_EXIT } from "../usage-exit.constants.ts";
import type { CommandHost } from "./command-host.ts";
import type { CommandSpec } from "./command-spec.ts";
import { parseTarget } from "./parse-target.ts";
import { pickProducts } from "./pick-products.ts";
import { usageLine } from "./usage-line.ts";

async function runAll(spec: CommandSpec, products: Product[], host: CommandHost): Promise<number> {
  const root = host.root(host.cwd);
  let failed = 0;

  await runInOrder(products, async (product) => {
    try {
      await spec.work(product, root);
    } catch (error) {
      host.stderr(`infra ${spec.name}: ${product.name}: ${error instanceof Error ? error.message : String(error)}`);
      failed += 1;
    }
  });

  if (failed === 0 && spec.done !== undefined) host.stdout(spec.done);

  return failed === 0 ? 0 : FAILURE_EXIT;
}

/**
 * Parses `[name|--all]`, runs the guard, picks the products and runs the work on each one, printing each failure
 * as `infra <command>: <product>: <message>`. Resolves to 2 for bad args, 1 for any failure, else 0.
 */
export async function runCommand(spec: CommandSpec, args: readonly string[], host: CommandHost): Promise<number> {
  const parsed = parseTarget(args);

  if (parsed === undefined) {
    host.stderr(usageLine(spec.name, spec.usageFlags));

    return USAGE_EXIT;
  }

  try {
    host.guard();

    const root = host.root(host.cwd);
    const products = await host.discover(root);
    const selection = pickProducts({ cwd: host.cwd, products, root }, parsed.target);

    if (!selection.ok) throw new Error(selection.error);

    return await runAll(spec, selection.products, host);
  } catch (error) {
    host.stderr(`infra ${spec.name}: ${error instanceof Error ? error.message : String(error)}`);

    return FAILURE_EXIT;
  }
}
