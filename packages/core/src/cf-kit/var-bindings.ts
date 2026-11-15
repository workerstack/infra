import { bindings, type TextBinding } from "@cloudflare/config";

import type { InfraScope } from "../schema/infra.ts";
import type { EnvKeyRef, KeyPick } from "./cf-kit-types.ts";
import { ENVIRONMENT_VAR } from "./cf-kit.constants.ts";
import type { CfKit } from "./cf-kit.ts";
import { pickedKeys } from "./key-map.ts";
import type { KitContext } from "./kit-context.ts";
import { readValue } from "./read-value.ts";

function byKey([a]: [string, string], [b]: [string, string]): number {
  return Number(a > b) - Number(a < b);
}

/**
 * `ENVIRONMENT` is always written, the scope's own value when it sets one, else the scope name; then the vars asked
 * for, sorted. A sealed key is refused: it is granted with `secrets`.
 */
export function varBindings({ config, keys: map }: KitContext): Pick<CfKit, "vars"> {
  return {
    vars: <E extends InfraScope, R extends EnvKeyRef>(scope: E, pick: KeyPick<Record<string, EnvKeyRef>, R>) => {
      const sealed = config.env.sealedKeys?.(scope) ?? new Set<string>();

      const asked = pickedKeys(pick(map))
        .filter((key) => key !== ENVIRONMENT_VAR)
        .map((key): [string, string] => {
          if (sealed.has(key)) throw new Error(`${key} is sealed in ${scope}; ask kit.secrets for it, not kit.vars`);

          return [key, readValue({ config, key, scope })];
        });

      const environment: [string, string] = [ENVIRONMENT_VAR, config.env[scope][ENVIRONMENT_VAR] ?? scope];

      return Object.fromEntries(
        [environment, ...asked].toSorted(byKey).map(([key, value]) => [key, bindings.text(value)]),
      ) /* one entry per key and ENVIRONMENT, whose type is the scope */ as Record<R["key"], TextBinding> & {
        ENVIRONMENT: TextBinding<E>;
      };
    },
  };
}
