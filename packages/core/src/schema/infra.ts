import type { WorkerConfig } from "@cloudflare/config";

import type { AppleConfig } from "./apple.ts";
import type { EnvBindings } from "./bindings.ts";
import type { CloudflareConfig, CloudflareConfigInput } from "./cloudflare.ts";
import type { GithubConfig } from "./github.ts";
import type { GoogleConfig } from "./google.ts";
import type { LocalConfig } from "./local-config.ts";
import type { MicrosoftConfig } from "./microsoft.ts";

/** One deploy scope: the local stack, a dev deploy or a prod deploy. */
export type InfraScope = "local" | "dev" | "prod";

/** One scope's view of the env: string values by key. */
type EnvView = Readonly<Record<string, string | undefined>>;

/**
 * The product's env: any object with `global`, `local`, `dev` and `prod` views of string values,
 * such as a `defineEnv` instance. Credentials are read from a view when a command runs, never at
 * config load. With no `sealedKeys`, no key is sealed.
 */
export type InfraEnv = {
  readonly dev: EnvView;
  readonly global: EnvView;
  readonly local: EnvView;
  readonly prod: EnvView;
  /** The keys sealed in a scope: secret values that never go into a plain var. */
  sealedKeys?(scope: InfraScope): ReadonlySet<string>;
};

/**
 * Top-level multi-provider infrastructure config — pre-parse shape. Pass to `defineInfraConfig`.
 * Generic in the binding sets, the env and the Workers' defaults, so the kit it returns keeps their names.
 */
export type InfraConfigInput<
  B extends Record<string, EnvBindings> = Record<string, EnvBindings>,
  V extends InfraEnv = InfraEnv,
  D extends Partial<WorkerConfig> = Partial<WorkerConfig>,
> = {
  /** Apple provider (Sign in with Apple). */
  apple?: AppleConfig;
  /** Cloudflare provider (zone, bindings, Access, Turnstile, R2). */
  cloudflare?: CloudflareConfigInput<B, D>;
  /** The product env holding the account credentials. */
  env: V;
  /** GitHub provider (sign-in with a GitHub App). */
  github?: GithubConfig;
  /** Google provider (OAuth, Search Console). */
  google?: GoogleConfig;
  /** The local stack's host and URL vars. */
  local?: LocalConfig;
  /** Microsoft provider (Entra OAuth). */
  microsoft?: MicrosoftConfig;
};

/**
 * Parsed infrastructure config — what runners consume. Same shape as input but with
 * zod defaults populated on the Cloudflare side.
 */
export type InfraConfig<
  _B extends Record<string, EnvBindings> = Record<string, EnvBindings>,
  V extends InfraEnv = InfraEnv,
> = {
  apple?: AppleConfig;
  cloudflare?: CloudflareConfig;
  env: V;
  github?: GithubConfig;
  google?: GoogleConfig;
  local?: LocalConfig;
  microsoft?: MicrosoftConfig;
};
