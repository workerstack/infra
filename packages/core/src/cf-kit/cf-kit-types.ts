import type { QueueConsumerTriggerOptions } from "@cloudflare/config";

import type { InfraEnv, InfraScope } from "../schema/infra.ts";
import type { NamesIn } from "../schema/names-in.ts";
import type { InfraSealedKey, InfraVarKey } from "../shared/infra-keys.constants.ts";
import type { ENV_KEY_REF } from "./cf-kit.constants.ts";

/** What a pick returns: `(env) => [env.GREETING]`. An index-signature env yields `undefined` for any key. */
export type KeyPick<M, R extends EnvKeyRef = EnvKeyRef> = (env: M) => readonly (R | undefined)[];

/** A key of the env by name, not its value: what a pick returns, read off the map its `env` argument is. */
export type EnvKeyRef<K extends string = string> = { readonly [ENV_KEY_REF]: true; readonly key: K };

/**
 * A queue consumer by the queue's binding name in infra, and its dead letter queue the same way; the rest is
 * Cloudflare's own consumer options.
 */
export type QueueConsumerSpec<Q extends string> = { deadLetterQueue?: Q; queue: Q } & Omit<
  QueueConsumerTriggerOptions,
  "deadLetterQueue" | "name"
>;

export type RatelimitSpec<N extends string = string> = {
  name: N;
  simple: { limit: number; period: 10 | 60 };
};

/** The names a kit accepts, by binding kind. */
export type BindingNames = {
  ai_search: string;
  analytics: string;
  d1: string;
  env: InfraScope;
  kv: string;
  queue: string;
  r2: string;
  secrets: Record<string, EnvKeyRef>;
  vars: Record<string, EnvKeyRef>;
};

// The keys of every scope view together; an intersection keeps each key's declaration for go-to-definition.
type Views<V extends InfraEnv> = V["dev"] & V["local"] & V["prod"];

// The keys `sealedKeys` returns the type of; every key when it is missing or returns a plain `ReadonlySet<string>`.
type Sealed<V> = V extends { sealedKeys: (...args: never[]) => ReadonlySet<infer S> } ? S & string : string;

type Open<V> = string extends Sealed<V> ? true : false;

// A homomorphic map over the views, so a key still leads to its `defineEnv` literal.
type RefMap<T, A extends PropertyKey> = { readonly [P in keyof Pick<T, Extract<keyof T, A>>]: EnvKeyRef<P & string> };

type InfraRefs<N extends string> = { readonly [P in N]: EnvKeyRef<P> };

type SecretMap<V extends InfraEnv> = RefMap<Views<V>, Open<V> extends true ? string : Sealed<V>> &
  InfraRefs<InfraSealedKey>;

type VarMap<V extends InfraEnv> = RefMap<Views<V>, Open<V> extends true ? string : Exclude<keyof Views<V>, Sealed<V>>> &
  InfraRefs<InfraVarKey>;

/**
 * The names the kit of a config with bindings `B` and env `V` accepts: binding names from its bindings, and for vars
 * and secrets the maps a pick reads: plain keys of the env's views with infra's var keys, sealed keys with infra's
 * sealed keys.
 */
export type KeysOf<B, V extends InfraEnv> = {
  ai_search: NamesIn<B, "ai_search">;
  analytics: NamesIn<B, "analytics_engine_datasets">;
  d1: NamesIn<B, "d1_databases">;
  env: InfraScope;
  kv: NamesIn<B, "kv_namespaces">;
  queue: NamesIn<B, "queues">;
  r2: NamesIn<B, "r2_buckets">;
  secrets: SecretMap<V>;
  vars: VarMap<V>;
};
