import type { InfraScope } from "../schema/infra.ts";
import type { CfKit } from "./cf-kit.ts";
import type { KitContext } from "./kit-context.ts";
import { readValue } from "./read-value.ts";

/**
 * The values of the secrets a Worker declares, read from the env's scope view; an empty one fails, since wrangler
 * cannot run without it.
 */
export function secretValues(context: KitContext): Pick<CfKit, "secretValues"> {
  return {
    secretValues(scope: InfraScope, keys) {
      return Object.fromEntries(
        keys.map((key) => {
          const value = readValue({ config: context.config, key, scope });

          if (value === "") throw new Error(`${key} has no ${scope} value in env`);

          return [key, value];
        }),
      );
    },
  };
}
