import type { QueueConsumerTriggerOptions } from "@cloudflare/config";

import type { InfraEnv, InfraScope } from "../schema/infra.ts";
import type { NamesIn } from "../schema/names-in.ts";
import type { InfraSealedKey, InfraVarKey } from "../shared/infra-keys.constants.ts";
import type { ENV_KEY_REF } from "./cf-kit.constants.ts";

/** What a pick returns: `(env) => [env.GREETING]`. An index-signature env yields `undefined` for any key. */
export type KeyPick<M, R extends EnvKeyRef = EnvKeyRef> = (env: M) => readonly (R | undefined)[];

/** A key of the env by name, not its value: what a pick returns, read off the map its `env` argument is. */
export type EnvKeyRef<K extends string = string> = {
  readonly [ENV_KEY_REF]: true;
  /** The env key's name. */
  readonly key: K;
};

/**
 * A queue consumer by the queue's binding name in infra, and its dead letter queue the same way; the rest is
 * Cloudflare's own consumer options.
 */
export type QueueConsumerSpec<Q extends string> = {
  /** The binding name of the queue that receives messages this consumer gives up on. */
  deadLetterQueue?: Q;
  /** The binding name of the queue to consume. */
  queue: Q;
} & Omit<QueueConsumerTriggerOptions, "deadLetterQueue" | "name">;

/** One rate limiter a Worker binds: its name and a simple limit. */
export type RatelimitSpec<N extends string = string> = {
  /** The binding name of the limiter. */
  name: N;
  /** Allows `limit` requests per `period` seconds. */
  simple: {
    /** The most requests allowed in one period. */
    limit: number;
    /** The period length in seconds. */
    period: 10 | 60;
  };
};

/** The names a kit accepts, by binding kind. */
export type BindingNames = {
  /** An AI Search binding name. */
  ai_search: string;
  /** An Analytics Engine dataset binding name. */
  analytics: string;
  /** A database binding name. */
  d1: string;
  /** The scope whose env the Worker reads. */
  env: InfraScope;
  /** A KV namespace binding name. */
  kv: string;
  /** A queue binding name. */
  queue: string;
  /** An R2 bucket binding name. */
  r2: string;
  /** Env keys to grant as secrets, by the name the Worker reads them as. */
  secrets: Record<string, EnvKeyRef>;
  /** Env keys to grant as plain vars, by the name the Worker reads them as. */
  vars: Record<string, EnvKeyRef>;
};

/** The keys of every scope view together; an intersection keeps each key's declaration for go-to-definition. */
type Views<V extends InfraEnv> = V["dev"] & V["local"] & V["prod"];

/** The keys `sealedKeys` returns the type of; every key when it is missing or returns a plain `ReadonlySet<string>`. */
type Sealed<V> = V extends { sealedKeys: (...args: never[]) => ReadonlySet<infer S> } ? S & string : string;

/** Whether every key of the env is open, because no key is sealed by type. */
type Open<V> = string extends Sealed<V> ? true : false;

/** A homomorphic map over the views, so a key still leads to its `defineEnv` literal. */
type RefMap<T, A extends PropertyKey> = { readonly [P in keyof Pick<T, Extract<keyof T, A>>]: EnvKeyRef<P & string> };

/** A ref for each of the infra-owned key names `N`. */
type InfraRefs<N extends string> = { readonly [P in N]: EnvKeyRef<P> };

/** The secrets a pick reads: the env's sealed keys with infra's sealed keys. */
type SecretMap<V extends InfraEnv> = RefMap<Views<V>, Open<V> extends true ? string : Sealed<V>> &
  InfraRefs<InfraSealedKey>;

/** The vars a pick reads: the env's plain keys with infra's var keys. */
type VarMap<V extends InfraEnv> = RefMap<Views<V>, Open<V> extends true ? string : Exclude<keyof Views<V>, Sealed<V>>> &
  InfraRefs<InfraVarKey>;

/**
 * The names the kit of a config with bindings `B` and env `V` accepts: binding names from its bindings, and for vars
 * and secrets the maps a pick reads: plain keys of the env's views with infra's var keys, sealed keys with infra's
 * sealed keys.
 */
export type KeysOf<B, V extends InfraEnv> = {
  /** The AI Search binding names the config declares. */
  ai_search: NamesIn<B, "ai_search">;
  /** The Analytics Engine dataset names the config declares. */
  analytics: NamesIn<B, "analytics_engine_datasets">;
  /** The database binding names the config declares. */
  d1: NamesIn<B, "d1_databases">;
  /** The scopes a Worker can read the env of. */
  env: InfraScope;
  /** The KV namespace names the config declares. */
  kv: NamesIn<B, "kv_namespaces">;
  /** The queue binding names the config declares. */
  queue: NamesIn<B, "queues">;
  /** The R2 bucket names the config declares. */
  r2: NamesIn<B, "r2_buckets">;
  /** The sealed env keys a Worker can be granted as secrets. */
  secrets: SecretMap<V>;
  /** The plain env keys a Worker can be granted as vars. */
  vars: VarMap<V>;
};
