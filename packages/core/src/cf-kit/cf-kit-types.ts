import type { QueueConsumerTriggerOptions } from "@cloudflare/config";

import type { InfraConfig, InfraScope } from "../schema/infra.ts";
import type { InfraSealedKey, InfraVarKey } from "../shared/infra-keys.constants.ts";

/**
 * The binding kinds a kit can own `remote` for in scope `local` (`localRemote`): the storage every Worker of a
 * product shares.
 */
export type LocalRemoteKind = "d1_databases" | "r2_buckets";

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
  secret: string;
  var: string;
};

// `defineInfraConfig` types `bindings` as `Record<string, EnvBindings> & <the literal bindings>`; that index
// signature would make every name a plain string, so it is dropped to keep the names.
type WithoutIndex<T> = { [K in keyof T as string extends K ? never : K]: T[K] };

type BindingsUnion<I> = I extends { cloudflare?: { bindings: infer B } }
  ? WithoutIndex<B>[keyof WithoutIndex<B>]
  : never;

// Names declared in any scope: a binding only some scopes have (`ai_search`) is still nameable, and asking for it in
// a scope that lacks it fails generation with the scope named.
type NamesIn<U, F extends string> = U extends unknown
  ? F extends keyof U
    ? keyof NonNullable<U[F]> & string
    : never
  : never;

// Keys any scope view has. Which of them are sealed is only known at run time.
type ViewKeys<V> = V extends { dev: infer D; local: infer L; prod: infer P }
  ? (keyof D | keyof L | keyof P) & string
  : never;

/**
 * The names a kit built from config `I` accepts: binding names from its bindings, var and secret names from its
 * env's scope views and the infra keys.
 */
export type KeysOf<I extends InfraConfig> = {
  ai_search: NamesIn<BindingsUnion<I>, "ai_search">;
  analytics: NamesIn<BindingsUnion<I>, "analytics_engine_datasets">;
  d1: NamesIn<BindingsUnion<I>, "d1_databases">;
  env: InfraScope;
  kv: NamesIn<BindingsUnion<I>, "kv_namespaces">;
  queue: NamesIn<BindingsUnion<I>, "queues">;
  r2: NamesIn<BindingsUnion<I>, "r2_buckets">;
  secret: ViewKeys<I["env"]> | InfraSealedKey;
  var: Exclude<ViewKeys<I["env"]>, InfraSealedKey> | InfraVarKey;
};
