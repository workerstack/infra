import type { InfraScope } from "../schema/infra.ts";

/** A secret to write to the env: `key` in `scope`'s view, set later with `bun repo env set`. */
export type SecretWrite = { key: string; scope: InfraScope; value: string };
