import type { InfraEnv, InfraScope } from "../../schema/infra.ts";

/** An env whose `scope` view holds `values` and every other view is empty. */
export function fakeEnv(scope: InfraScope, values: Record<string, string> = {}): InfraEnv {
  return { dev: {}, global: {}, local: {}, prod: {}, [scope]: values };
}
