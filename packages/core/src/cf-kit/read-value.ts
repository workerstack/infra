import type { InfraConfig, InfraScope } from "../schema/infra.ts";
import { infraValue } from "./infra-value.ts";
import { isInfraVarKey } from "./is-infra-var-key.ts";

type ValueRead = { config: InfraConfig; key: string; scope: InfraScope };

/**
 * One scope's value for a key: infra's for the names it resolves, else the env's scope view. A missing one, or an
 * empty sealed one, fails naming the key and scope.
 */
export function readValue({ config, key, scope }: ValueRead): string {
  if (isInfraVarKey(key)) {
    const resolved = infraValue({ config, key, scope });

    if (resolved === undefined) throw new Error(`${key} has no ${scope} value in infra`);

    return resolved;
  }

  const value = config.env[scope][key];

  if (value === undefined) throw new Error(`${key} has no ${scope} value in env`);

  return value;
}
