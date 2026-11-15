import type { InfraScope } from "../schema/infra.ts";

/** A secret to write to the env: `key` in `scope`'s view, set later with `bun repo env set`. */
export type SecretWrite = {
  /** The env key to set, such as `CF_API_TOKEN`. */
  key: string;
  /** The scope whose env view gets the key. */
  scope: InfraScope;
  /** The secret value. Never log it. */
  value: string;
};
