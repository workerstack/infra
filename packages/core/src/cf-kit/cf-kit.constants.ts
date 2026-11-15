/**
 * The kit's switch `infra gen` alone turns: while it runs, a limiter with no id gets the next one and the registry
 * is written, where anywhere else the missing id fails the config. A registered symbol, since the generator and the
 * product's `infra.config.ts` may each load their own copy of this module.
 */
export const ALLOCATE_RATELIMITS: unique symbol = /* @__PURE__ */ Symbol.for("@workerstack/infra/allocate-ratelimits");

/**
 * Vite's default `mode` for `vite dev`. The Cloudflare Vite plugin refuses a mode named `local`, so a Vite app runs
 * its `local` scope under this one, and a kit reads it as `local`.
 */
export const VITE_DEV_MODE = "development";

/** The failure for a missing `--mode`, naming the scopes. */
export const NO_MODE_MESSAGE = "no mode: pass --mode local, dev or prod";

/** The var every Worker gets: the scope's own value when it sets one, else the scope name. */
export const ENVIRONMENT_VAR = "ENVIRONMENT";

/** The global key holding the account id a Worker reads as `CF_ACCOUNT_ID`. */
export const ACCOUNT_ID_GLOBAL_KEY = "CLOUDFLARE_ACCOUNT_ID";

/**
 * Marks a kit, so a loader tells `defineInfraConfig`'s value from any other export. A registered symbol: the
 * product's `infra.config.ts` and the generator may each load their own copy of this module.
 */
export const CF_KIT: unique symbol = /* @__PURE__ */ Symbol.for("@workerstack/infra/cf-kit");

/**
 * The kit's hand-off of its product root, which the loader of `infra.config.ts` gives it: the unset rate-limit
 * registry lives there. A registered symbol, like `CF_KIT`.
 */
export const PRODUCT_ROOT: unique symbol = /* @__PURE__ */ Symbol.for("@workerstack/infra/product-root");

/** The registry file at the product root when `cloudflare.workers.ratelimitIds` is unset. */
export const RATELIMIT_IDS_FILE = "ratelimit-ids.json";

/** The failure for a limiter whose kit has no registry: none set, no root handed to it, none above the cwd. */
export const NO_REGISTRY_MESSAGE =
  "no rate-limit registry: set cloudflare.workers.ratelimitIds in infra.config.ts, or run inside the product";

/**
 * Marks a key ref, the value a pick reads off its `env` map: it names a key, not a value. A registered symbol, like
 * `CF_KIT`.
 */
export const ENV_KEY_REF: unique symbol = /* @__PURE__ */ Symbol.for("@workerstack/infra/env-key-ref");

/**
 * Where the function `infra.worker` returns carries its build settings (`minify`, `uploadSourceMaps`,
 * `assetsDirectory`) as a function of the scope, since Cloudflare's `WorkerConfig` has no key for them. `infra gen`
 * reads it beside the module's default export. A registered symbol, like `CF_KIT`.
 */
export const WORKER_BUILD: unique symbol = /* @__PURE__ */ Symbol.for("@workerstack/infra/worker-build");
