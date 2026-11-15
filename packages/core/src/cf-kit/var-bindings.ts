import { bindings, type TextBinding } from "@cloudflare/config";

import type { InfraScope } from "../schema/infra.ts";
import { ENVIRONMENT_VAR } from "./cf-kit.constants.ts";
import type { CfKit } from "./cf-kit.ts";
import type { KitContext } from "./kit-context.ts";
import { readValue } from "./read-value.ts";

function byKey([a]: [string, string], [b]: [string, string]): number {
  return Number(a > b) - Number(a < b);
}

/**
 * `ENVIRONMENT` is always written, the scope's own value when it sets one, else the scope name; then the vars asked
 * for, sorted. A sealed key is refused: it is granted with `secrets`.
 */
export function varBindings({ config }: KitContext): Pick<CfKit, "vars"> {
  return {
    vars: <E extends InfraScope, V extends string>(scope: E, ...keys: V[]) => {
      const sealed = config.env.sealedKeys(scope);

      const asked = keys
        .filter((key) => key !== ENVIRONMENT_VAR)
        .map((key): [string, string] => {
          if (sealed.has(key)) throw new Error(`${key} is sealed in ${scope}; ask kit.secrets for it, not kit.vars`);

          return [key, readValue({ config, key, scope })];
        });

      const environment: [string, string] = [ENVIRONMENT_VAR, config.env[scope][ENVIRONMENT_VAR] ?? scope];

      return Object.fromEntries(
        [environment, ...asked].toSorted(byKey).map(([key, value]) => [key, bindings.text(value)]),
      ) /* one entry per asked key and ENVIRONMENT, whose literal type is the scope */ as Record<V, TextBinding> & {
        ENVIRONMENT: TextBinding<E>;
      };
    },
  };
}
