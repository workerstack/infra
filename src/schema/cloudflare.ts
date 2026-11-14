import type { EnvBindings } from "./bindings.ts";
import type { CloudflareAccessEnv, CloudflareR2Credentials, CloudflareTurnstileEnv } from "./cloudflare-env.ts";
import type { ZoneConfig, ZoneConfigInput } from "./zone.ts";

/**
 * Input shape for the CF provider — accepts partial config (zod defaults applied on parse).
 * Account credentials are not config: they come from `env.global` (`CLOUDFLARE_ACCOUNT_ID`,
 * `CLOUDFLARE_ACCOUNT_EMAIL`, `CLOUDFLARE_API_KEY`, `CLOUDFLARE_API_TOKEN`).
 */
export type CloudflareConfigInput<B extends Record<string, EnvBindings> = Record<string, EnvBindings>> = {
  /** Per-env CF Access config, keyed by env name (`dev` / `prod` / …). */
  access?: Record<string, CloudflareAccessEnv>;
  /** Per-env worker binding set. */
  bindings?: B;
  /** R2 S3-API config (optional — only needed for direct S3 access). */
  r2?: CloudflareR2Credentials;
  /** Per-env Turnstile widget config. */
  turnstile?: Record<string, CloudflareTurnstileEnv>;
  /** Zone-level config (DNS, WAF, SSL, cache …). */
  zone: ZoneConfigInput;
};

/**
 * Parsed CF provider config — identical to `CloudflareConfigInput` but with zod
 * defaults populated (`bindings` always defined, zone schema fully resolved).
 */
export type CloudflareConfig = {
  access?: Record<string, CloudflareAccessEnv> | undefined;
  bindings: Record<string, EnvBindings>;
  r2?: CloudflareR2Credentials | undefined;
  turnstile?: Record<string, CloudflareTurnstileEnv> | undefined;
  zone: ZoneConfig;
};
