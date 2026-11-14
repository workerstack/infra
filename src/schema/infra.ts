import type { AppleConfig } from "./apple.ts";
import type { CloudflareConfig, CloudflareConfigInput } from "./cloudflare.ts";
import type { GoogleConfig } from "./google.ts";
import type { LocalConfig } from "./local-config.ts";
import type { MicrosoftConfig } from "./microsoft.ts";

/**
 * Top-level multi-provider infrastructure config — pre-parse shape. Pass to `defineInfraConfig`.
 */
export type InfraConfigInput = {
  /** Apple provider (Sign in with Apple). */
  apple?: AppleConfig;
  /** Cloudflare provider (zone, bindings, Access, Turnstile, R2). */
  cloudflare?: CloudflareConfigInput;
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
export type InfraConfig = {
  apple?: AppleConfig;
  cloudflare?: CloudflareConfig;
  google?: GoogleConfig;
  local?: LocalConfig;
  microsoft?: MicrosoftConfig;
};
