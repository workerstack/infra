import type { InfraScope } from "../schema/infra.ts";
import { INFRA_SCOPES } from "./infra-scopes.constants.ts";
import { runInOrder } from "./run-in-order.ts";

/** Runs `run` for each scope the per-scope config has, one at a time in scope order. */
export async function eachOAuthScope<T>(
  oauth: Partial<Record<InfraScope, T>> | undefined,
  run: (scope: InfraScope, entry: T) => Promise<void>,
): Promise<void> {
  await runInOrder([...INFRA_SCOPES], async (scope) => {
    const entry = oauth?.[scope];

    if (entry !== undefined) await run(scope, entry);
  });
}
