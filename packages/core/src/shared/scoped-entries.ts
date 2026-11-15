import type { InfraScope } from "../schema/infra.ts";
import { INFRA_SCOPES } from "./infra-scopes.constants.ts";

/** The `[scope, value]` pairs of a record keyed by scope, in scope order, leaving out missing scopes. */
export function scopedEntries<T>(record: Partial<Record<InfraScope, T>> | undefined): Array<[InfraScope, T]> {
  return INFRA_SCOPES.flatMap((scope) => {
    const value = record?.[scope];

    return value === undefined ? [] : [[scope, value]];
  });
}
