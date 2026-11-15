import type { QueueConsumerTriggerOptions } from "@cloudflare/config";

import type { InfraEnv, InfraScope } from "../schema/infra.ts";
import type { NamesIn } from "../schema/names-in.ts";
import type { InfraSealedKey, InfraVarKey } from "../shared/infra-keys.constants.ts";

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

// Keys any scope view has. Which of them are sealed is only known at run time.
type ViewKeys<V> = V extends { dev: infer D; local: infer L; prod: infer P }
  ? (keyof D | keyof L | keyof P) & string
  : never;

/**
 * The names the kit of a config with bindings `B` and env `V` accepts: binding names from its bindings, var and
 * secret names from the env's scope views and the infra keys.
 */
export type KeysOf<B, V extends InfraEnv> = {
  ai_search: NamesIn<B, "ai_search">;
  analytics: NamesIn<B, "analytics_engine_datasets">;
  d1: NamesIn<B, "d1_databases">;
  env: InfraScope;
  kv: NamesIn<B, "kv_namespaces">;
  queue: NamesIn<B, "queues">;
  r2: NamesIn<B, "r2_buckets">;
  secret: ViewKeys<V> | InfraSealedKey;
  var: Exclude<ViewKeys<V>, InfraSealedKey> | InfraVarKey;
};
