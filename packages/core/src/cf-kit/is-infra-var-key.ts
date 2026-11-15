import { INFRA_VAR_KEYS, type InfraVarKey } from "../shared/infra-keys.constants.ts";

/** Whether a Worker's var is one infra resolves rather than the env holding it. */
export function isInfraVarKey(key: string): key is InfraVarKey {
  return INFRA_VAR_KEYS.some((known) => known === key);
}
