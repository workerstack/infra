import type { InfraEnv, InfraScope } from "../../schema/infra.ts";
import { fakeInfraEnv } from "../../shared/__fixtures__/fake-infra-env.ts";

/** An env whose `scope` view holds `values` and every other view is empty. */
export function fakeEnv(scope: InfraScope, values: Record<string, string> = {}): InfraEnv {
  return fakeInfraEnv({ [scope]: values });
}
