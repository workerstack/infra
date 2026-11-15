import type {
  AiSearchBinding,
  AnalyticsEngineDatasetBinding,
  D1Binding,
  FetchTrigger,
  KvBinding,
  QueueBinding,
  QueueConsumerTrigger,
  R2Binding,
  RateLimitBinding,
  SecretBinding,
  TextBinding,
  WorkerBinding,
  WorkerConfig,
} from "@cloudflare/config";

import type { InfraScope } from "../schema/infra.ts";
import type { BindingNames, QueueConsumerSpec, RatelimitSpec } from "./cf-kit-types.ts";
import type { ALLOCATE_RATELIMITS, CF_KIT } from "./cf-kit.constants.ts";

/**
 * The typed helpers a Worker's `cloudflare.config.ts` builds its bindings with. Declared with method syntax, so the
 * kit typed to its product's names also reads as the kit that accepts any name (`CfKit`).
 */
export type CfKit<K extends BindingNames = BindingNames, D extends Partial<WorkerConfig> = Partial<WorkerConfig>> = {
  readonly [CF_KIT]: true;
  /** Runs `run` with rate-limit allocation on: what `infra gen` wraps its loads of the product's configs in. */
  [ALLOCATE_RATELIMITS]<T>(run: () => Promise<T>): Promise<T>;
  aiSearch<N extends K["ai_search"]>(env: K["env"], ...names: N[]): Record<N, AiSearchBinding>;
  analytics<N extends K["analytics"]>(env: K["env"], ...names: N[]): Record<N, AnalyticsEngineDatasetBinding>;
  /** What every Worker of the product shares; a config spreads it first and overrides after. */
  readonly defaults: D;
  d1<N extends K["d1"]>(env: K["env"], ...names: N[]): Record<N, D1Binding>;
  /** The scope for a `--mode`; Vite's dev default, `development`, is `local`. */
  env(mode: string | undefined): K["env"];
  /** Every scope the kit's Workers deploy or run as: what `infra gen` loops over. */
  readonly envs: readonly InfraScope[];
  kv<N extends K["kv"]>(env: K["env"], ...names: N[]): Record<N, KvBinding>;
  /**
   * The package dirs the product's zone sends visitors from to their locale at the edge, relative to the product
   * root.
   */
  readonly localeApps: readonly string[];
  /** The product's portless host in local (`acme.localhost`), when its infra has a local block. */
  readonly localHost: string | undefined;
  /**
   * The URL vars the product's local stack sets (`{}` with no local block): the running stack's origin, or the
   * portless host with none running.
   */
  localUrlVars(origin?: string): Record<string, string>;
  /** The migrations a D1 binding owns: its directory, owner Worker and `database` name; none for any other binding. */
  migrations(binding: string): { database?: string; dir: string; owner: string } | undefined;
  /**
   * The directory of the migrations a D1 binding owns, absolute: answered for the one Worker that owns them (by
   * its deployed name in `env`).
   */
  migrationsDir(env: K["env"], worker: string, binding: string): string | undefined;
  name(base: string, env: K["env"]): string;
  queue<N extends K["queue"]>(env: K["env"], ...names: N[]): Record<N, QueueBinding>;
  queueConsumers(env: K["env"], consumers: readonly QueueConsumerSpec<K["queue"]>[]): QueueConsumerTrigger[];
  r2<N extends K["r2"]>(env: K["env"], ...names: N[]): Record<N, R2Binding>;
  /** The registry file the limiters' namespace ids live in. */
  readonly ratelimitIds: string;
  /** Limits by name; each namespace id is the registry's, so a limiter keeps its counters. */
  ratelimits<const N extends string>(
    worker: string,
    env: K["env"],
    ...limits: RatelimitSpec<N>[]
  ): Record<N, RateLimitBinding>;
  routes(patterns: readonly string[], zone: string): FetchTrigger[];
  /**
   * Secrets by name: the binding only. A key must be sealed in every scope; the values go up with a deploy and run
   * locally from `.dev.vars.local`.
   */
  secrets<S extends K["secret"]>(...keys: S[]): Record<S, SecretBinding>;
  /**
   * The values of the secrets a Worker declares, for one scope: what a deploy uploads and `.dev.vars.<scope>`
   * holds. A secret with no value fails naming the key and scope.
   */
  secretValues(env: K["env"], keys: readonly string[]): Record<string, string>;
  /** Service bindings by the target Worker's base name; the scope suffix is added here. */
  services<const S extends Readonly<Record<string, string>>>(
    env: K["env"],
    targets: S,
  ): Record<keyof S & string, WorkerBinding>;
  /**
   * `ENVIRONMENT` is always written, the scope's own value when it sets one, else the scope name; then the vars
   * asked for, which must not be sealed.
   */
  vars<E extends K["env"], V extends K["var"]>(
    env: E,
    ...keys: V[]
  ): Record<V, TextBinding> & { ENVIRONMENT: TextBinding<E> };
  /** The product's Cloudflare zone (`acme.ai`), when its infra has one. */
  readonly zoneDomain: string | undefined;
};
