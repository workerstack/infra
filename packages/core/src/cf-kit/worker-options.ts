import type { WorkerConfig } from "@cloudflare/config";

import type { InfraScope } from "../schema/infra.ts";
import type { BindingNames, KeyPick, RatelimitSpec } from "./cf-kit-types.ts";

/**
 * What `infra.worker` builds a Worker from: each binding kind by its names, as the kit's method of that name takes
 * them, its routes on the config's zone (`zone` overrides), and `extra` for anything the shorthand does not cover.
 */
export type WorkerOptions<K extends BindingNames = BindingNames> = {
  /** The AI Search binding names to bind. */
  aiSearch?: readonly K["ai_search"][];
  /** The Analytics Engine dataset names to bind. */
  analytics?: readonly K["analytics"][];
  /** The static assets directory, relative to the package; `infra gen` writes it absolute as `assets.directory`. */
  assetsDirectory?: string;
  /** The Workers compatibility date. Unset, the product's default applies. */
  compatibilityDate?: string;
  /** The database binding names to bind. */
  d1?: readonly K["d1"][];
  /** The Worker's entry file, relative to the package. */
  entrypoint: string;
  /** Merged last, per scope: its `env` beside the shorthand's bindings, its `triggers` after the routes. */
  extra?: (scope: InfraScope) => Partial<WorkerConfig>;
  /** The KV namespace names to bind. */
  kv?: readonly K["kv"][];
  /** Minify the bundle; on unless `false`. */
  minify?: boolean;
  /** The queue names to bind as producers. */
  queue?: readonly K["queue"][];
  /** The R2 bucket names to bind. */
  r2?: readonly K["r2"][];
  /** The rate limiters to bind. */
  ratelimits?: readonly RatelimitSpec[];
  /** Route patterns on `zone`, else on the config's zone. */
  routes?: readonly string[];
  /** The sealed keys to grant, picked off the env: `(env) => [env.API_KEY]`. */
  secrets?(env: K["secrets"]): ReturnType<KeyPick<K["secrets"]>>;
  /** Service bindings by the target Worker's base name, as `services` takes them. */
  services?: Readonly<Record<string, string>>;
  /** Upload source maps, as Wrangler's `upload_source_maps`. */
  uploadSourceMaps?: boolean;
  /** The plain keys beside `ENVIRONMENT`, picked: `(env) => [env.GREETING]`; unset, the Worker gets no vars. */
  vars?(env: K["vars"]): ReturnType<KeyPick<K["vars"]>>;
  /** The zone the routes belong to. Unset, the config's zone. */
  zone?: string;
};
