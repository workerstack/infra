import { INFRA_SCOPES } from "../shared/infra-scopes.constants.ts";
import { LOCAL_SCOPE } from "../shared/local-scope.constants.ts";
import { NO_MODE_MESSAGE, VITE_DEV_MODE } from "./cf-kit.constants.ts";
import type { CfKit } from "./cf-kit.ts";

/** The scopes a kit has, and the scope a `--mode` names. */
export function kitModes(): Pick<CfKit, "env" | "envs"> {
  return {
    env(mode) {
      const named = mode === VITE_DEV_MODE ? LOCAL_SCOPE : mode;
      const found = INFRA_SCOPES.find((scope) => scope === named);

      if (found !== undefined) return found;

      throw new Error(mode === undefined ? NO_MODE_MESSAGE : `mode "${mode}" is not one of ${INFRA_SCOPES.join(", ")}`);
    },
    envs: INFRA_SCOPES,
  };
}
