import type { InfraConfig } from "../schema/infra.ts";
import { INFRA_SEALED_KEYS, INFRA_VAR_KEYS } from "../shared/infra-keys.constants.ts";
import { INFRA_SCOPES } from "../shared/infra-scopes.constants.ts";
import type { EnvKeyRef } from "./cf-kit-types.ts";
import { ENV_KEY_REF } from "./cf-kit.constants.ts";

/**
 * The map a pick reads its keys off: one key ref per key of the env's local, dev and prod views, the keys the env
 * seals and infra's key lists. Built once per kit. The types split it into plain and sealed keys; the run-time
 * checks of `vars` and `secrets` refuse a misuse the types missed.
 */
export function keyMap({ env }: InfraConfig): Record<string, EnvKeyRef> {
  const names = new Set([
    ...Object.keys(env.local),
    ...Object.keys(env.dev),
    ...Object.keys(env.prod),
    ...INFRA_SCOPES.flatMap((scope) => [...(env.sealedKeys?.(scope) ?? [])]),
    ...INFRA_VAR_KEYS,
    ...INFRA_SEALED_KEYS,
  ]);

  return Object.fromEntries([...names].map((key) => [key, { [ENV_KEY_REF]: true, key } as const]));
}

/** The key names of the refs a pick returned. */
export function pickedKeys<R extends EnvKeyRef>(refs: readonly (R | undefined)[]): R["key"][] {
  return refs.map((ref) => {
    if (ref === undefined) throw new Error("a pick named a key the env does not have");

    return ref.key;
  });
}
