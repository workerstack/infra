import type { InfraEnv } from "../../schema/infra.ts";
import { fakeInfraEnv } from "../../shared/__fixtures__/fake-infra-env.ts";

/** An env whose global view holds `values` and every scope view holds `scoped`. */
export function globalEnv(values: Record<string, string>, scoped: Record<string, string> = {}): InfraEnv {
  return fakeInfraEnv({ dev: scoped, global: values, local: scoped, prod: scoped });
}
