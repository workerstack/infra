/**
 * The kit's switch `infra gen` alone turns: while it runs, a limiter with no id gets the next one and the registry
 * is written, where anywhere else the missing id fails the config. A registered symbol, since the generator and the
 * kit file may each load their own copy of this module.
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
 * Marks a kit, so a generator finds it among a module's exports. A registered symbol: the kit file and the generator
 * may each load their own copy of this module.
 */
export const CF_KIT: unique symbol = /* @__PURE__ */ Symbol.for("@workerstack/infra/cf-kit");
