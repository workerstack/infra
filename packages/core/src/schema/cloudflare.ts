import type { WorkerConfig } from "@cloudflare/config";

import type { EnvBindings } from "./bindings.ts";
import type { CloudflareAccessEnv, CloudflareR2Credentials, CloudflareTurnstileEnv } from "./cloudflare-env.ts";
import type { InfraScope } from "./infra.ts";
import type { CloudflareWorkers, CloudflareWorkersInput } from "./workers.ts";
import type { ZoneConfig, ZoneConfigInput } from "./zone.ts";

/**
 * Input shape for the CF provider — accepts partial config (zod defaults applied on parse).
 * Account credentials are not config: they come from `env.global` (`CLOUDFLARE_ACCOUNT_ID`,
 * `CLOUDFLARE_ACCOUNT_EMAIL`, `CLOUDFLARE_API_KEY`, `CLOUDFLARE_API_TOKEN`).
 */
export type CloudflareConfigInput<
  B extends Record<string, EnvBindings> = Record<string, EnvBindings>,
  D extends Partial<WorkerConfig> = Partial<WorkerConfig>,
> = {
  /** Per-env CF Access config, keyed by scope (`local` / `dev` / `prod`). */
  access?: Partial<Record<InfraScope, CloudflareAccessEnv>>;
  /** Per-env worker binding set. */
  bindings?: B;
  /** R2 S3-API config (optional — only needed for direct S3 access). */
  r2?: CloudflareR2Credentials;
  /** Per-env Turnstile widget config. */
  turnstile?: Partial<Record<InfraScope, CloudflareTurnstileEnv>>;
  /** What the product's Workers share: defaults, migrations, remote kinds in local and the rate-limit registry. */
  workers?: CloudflareWorkersInput<B, D>;
  /** Zone-level config (DNS, WAF, SSL, cache …). */
  zone: ZoneConfigInput;
};

/**
 * Parsed CF provider config — identical to `CloudflareConfigInput` but with zod
 * defaults populated (`bindings` always defined, zone schema fully resolved).
 */
export type CloudflareConfig = {
  /** Per-scope Access config. */
  access?: Partial<Record<InfraScope, CloudflareAccessEnv>> | undefined;
  /** The worker binding set per scope. Empty when none is declared. */
  bindings: Record<string, EnvBindings>;
  /** R2 S3-API credentials config. */
  r2?: CloudflareR2Credentials | undefined;
  /** Per-scope Turnstile widget config. */
  turnstile?: Partial<Record<InfraScope, CloudflareTurnstileEnv>> | undefined;
  /** What the product's Workers share. */
  workers?: CloudflareWorkers | undefined;
  /** Zone-level config with defaults filled in. */
  zone: ZoneConfig;
};
