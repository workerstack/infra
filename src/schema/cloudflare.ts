import type { EnvBindings } from "./bindings.ts";
import type { CloudflareAccessEnv, CloudflareR2Credentials, CloudflareTurnstileEnv } from "./cloudflare-env.ts";
import type { ZoneConfig, ZoneConfigInput } from "./zone.ts";

/**
 * Input shape for the CF provider — accepts partial config (zod defaults applied on parse).
 */
export type CloudflareConfigInput = {
  /**
   * Email attached to the CF account. Used as `X-Auth-Email` header alongside `globalApiKey`.
   */
  accountEmail: string;
  /**
   * CF account ID (32-hex). Find it on any zone's Overview page in the dashboard,
   * right sidebar under "API". Same ID for every zone on the account.
   */
  accountId: string;
  /** Per-env CF Access config, keyed by env name (`dev` / `prod` / …). */
  access?: Record<string, CloudflareAccessEnv>;
  /**
   * CF Global API Key. Sent as `X-Auth-Key` + `X-Auth-Email` for zone-level and
   * account-level operations that require global-key auth. Find it at Dashboard →
   * My Profile → API Tokens → Global API Key.
   */
  globalApiKey: string;
  /**
   * Scoped CF API Token (`cfut_*` prefix). Sent as `Authorization: Bearer` for endpoints
   * that accept scoped tokens (e.g. AI Search). Create at Dashboard → My Profile →
   * API Tokens with the required permission scopes.
   */
  masterApiToken?: string;
  /**
   * Least-privilege account token (`cfat_*`) the product's Workers send as
   * `Authorization: Bearer` at runtime (`infra:gen` writes it to `CF_API_TOKEN`). Never the
   * global key: `cfk_*` is not a Bearer credential.
   */
  workerApiToken?: string;
  /** Per-env worker binding set. */
  bindings?: Record<string, EnvBindings>;
  /** R2 S3-API credentials (optional — only needed for direct S3 access). */
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
  accountEmail: string;
  accountId: string;
  access?: Record<string, CloudflareAccessEnv> | undefined;
  globalApiKey: string;
  masterApiToken?: string | undefined;
  workerApiToken?: string | undefined;
  bindings: Record<string, EnvBindings>;
  r2?: CloudflareR2Credentials | undefined;
  turnstile?: Record<string, CloudflareTurnstileEnv> | undefined;
  zone: ZoneConfig;
};
