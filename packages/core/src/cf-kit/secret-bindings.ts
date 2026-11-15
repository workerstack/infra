import { bindings } from "@cloudflare/config";

import { INFRA_SCOPES } from "../shared/infra-scopes.constants.ts";
import type { CfKit } from "./cf-kit.ts";
import { each } from "./each.ts";
import type { KitContext } from "./kit-context.ts";

/**
 * Secrets by name: the binding only. A key must be sealed in every scope, so no plain value is ever uploaded as a
 * secret.
 */
export function secretBindings({ config }: KitContext): Pick<CfKit, "secrets"> {
  return {
    secrets: (...keys) => {
      for (const scope of INFRA_SCOPES) {
        const sealed = config.env.sealedKeys?.(scope) ?? new Set<string>();
        const plain = keys.find((key) => !sealed.has(key));

        if (plain !== undefined) {
          throw new Error(
            `${plain} is not sealed in ${scope}; a secret must be sealed: bun repo env set ${plain} --scope ${scope}`,
          );
        }
      }

      return each(keys, () => bindings.secret());
    },
  };
}
