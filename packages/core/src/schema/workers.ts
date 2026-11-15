import type { WorkerConfig } from "@cloudflare/config";

import type { EnvBindings } from "./bindings.ts";
import type { NamesIn } from "./names-in.ts";

/**
 * The binding kinds the kit can own `remote` for in scope `local` (`localRemote`): the storage every Worker of a
 * product shares.
 */
export type LocalRemoteKind = "d1_databases" | "r2_buckets";

/**
 * The SQL migrations one database binding owns: an absolute directory, the base name of the Worker that owns them,
 * and the database name its `database.migrate.config.ts` uses.
 */
export type D1Migration = {
  /** The database name the migrations apply to. */
  database?: string;
  /** The absolute path of the migrations directory. */
  dir: string;
  /** The base name of the Worker that owns the migrations. */
  owner: string;
};

/**
 * What the product's Workers share, read by the kit `defineInfraConfig` returns. Generic in the bindings, so a
 * migration names a database binding the config declares, and in the defaults, so the kit hands them out typed.
 */
export type CloudflareWorkersInput<
  B extends Record<string, EnvBindings> = Record<string, EnvBindings>,
  D extends Partial<WorkerConfig> = Partial<WorkerConfig>,
> = {
  /** What every Worker of the product shares; a Worker's config spreads it first and overrides after. */
  defaults?: D;
  /** The kinds whose bindings read their remote resource in local. */
  localRemote?: readonly LocalRemoteKind[];
  /** The SQL migrations each database binding owns, and the database name `infra db-migrate` applies them as. */
  migrations?: { readonly [N in NamesIn<B, "d1_databases">]?: D1Migration };
  /**
   * The registry file the limiters' namespace ids live in, used as given (an absolute path). Unset, it is
   * `ratelimit-ids.json` at the product root.
   */
  ratelimitIds?: string;
};

/** `CloudflareWorkersInput` once parsed: any defaults, any binding names. */
export type CloudflareWorkers = {
  /** What every Worker of the product shares. */
  defaults?: Partial<WorkerConfig> | undefined;
  /** The kinds whose bindings read their remote resource in local. */
  localRemote?: readonly LocalRemoteKind[] | undefined;
  /** The migrations each database binding owns, by binding name. */
  migrations?: Readonly<Record<string, D1Migration>> | undefined;
  /** The absolute path of the rate-limit registry file. Unset, it is `ratelimit-ids.json` at the product root. */
  ratelimitIds?: string | undefined;
};
