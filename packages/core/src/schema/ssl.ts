import * as z from "zod";

import { HSTS_MAX_AGE_S } from "../hsts-max-age-s.constants.ts";

/**
 * HSTS (RFC 6797) sub-config. Tells compliant browsers to only contact the origin over HTTPS
 * for `maxAge` seconds. Persisted by CF via the `security_header` setting.
 */
function hstsConfigSchema(): z.ZodType<HstsConfig, HstsConfigInput> {
  return z.object({
    /**
     * Serve the `Strict-Transport-Security` response header at the edge. Disabling clears
     * the header — existing browser state still applies until their cached max-age expires.
     */
    enabled: z.boolean().default(true),
    /**
     * Apply HSTS to every subdomain. REQUIRED by the preload list, and one-way in practice:
     * once browsers have seen it, any subdomain served over plain HTTP for those users will hard-fail.
     * Verify every current and planned subdomain (app, api, staging, marketing, dev dashboards)
     * serves valid HTTPS BEFORE enabling.
     */
    includeSubDomains: z.boolean().default(true),
    /**
     * Seconds browsers must enforce HTTPS after seeing the header. Default 63072000 (2 years).
     * Preload minimum is 31536000 (1 year). Shorter = safer rollback; longer = stronger protection.
     */
    maxAge: z.number().int().min(0).default(HSTS_MAX_AGE_S),
    /**
     * Also serve `X-Content-Type-Options: nosniff`. CF bundles it with the security_header
     * setting so it's free to enable. Prevents MIME-type confusion attacks.
     */
    nosniff: z.boolean().default(true),
    /**
     * Add the `preload` directive. Required but not sufficient to appear in browsers' built-in
     * preload list — you must also submit the apex manually at https://hstspreload.org (reCAPTCHA-gated,
     * no API). Propagation to stable browser releases takes 4-12 weeks; removal takes 6-12 months.
     * Only enable once every subdomain is permanently HTTPS.
     */
    preload: z.boolean().default(false),
  });
}

/**
 * SSL/TLS edge configuration.
 */
export function sslConfigSchema(): z.ZodType<SslConfig, SslConfigInput> {
  return z.object({
    /**
     * Force HTTP → HTTPS 301 redirect at the edge. Maps to CF `always_use_https`.
     * Should be on whenever your zone is HTTPS-only.
     */
    alwaysHttps: z.boolean().default(true),
    /**
     * Rewrite mixed-content `http://` asset URLs to `https://` in served HTML.
     * Maps to CF `automatic_https_rewrites`. Cheap safety net for legacy hardcoded links.
     */
    autoRewrites: z.boolean().default(true),
    /**
     * HSTS (Strict-Transport-Security) configuration. See `hstsConfigSchema()` for the preload
     * gotchas — this is a one-way door once browsers have cached the header.
     */
    hsts: hstsConfigSchema().prefault({}),
    /**
     * Reject TLS connections below this version. Maps to CF `min_tls_version`.
     * `1.2` is the PCI-DSS floor and matches modern browser defaults.
     */
    minTls: z.enum(["1.0", "1.1", "1.2", "1.3"]).default("1.2"),
    /**
     * Enable TLS 1.3 (faster handshake, forward secrecy by default). Maps to CF `tls_1_3`.
     */
    tls13: z.boolean().default(true),
  });
}

/**
 * HSTS (RFC 6797) sub-config. Tells compliant browsers to only contact the origin over HTTPS
 * for `maxAge` seconds. Persisted by CF via the `security_header` setting.
 */
export type HstsConfigInput = {
  /**
   * Serve the `Strict-Transport-Security` response header at the edge. Disabling clears
   * the header — existing browser state still applies until their cached max-age expires.
   */
  enabled?: boolean | undefined;
  /**
   * Apply HSTS to every subdomain. REQUIRED by the preload list, and one-way in practice:
   * once browsers have seen it, any subdomain served over plain HTTP for those users will hard-fail.
   * Verify every current and planned subdomain (app, api, staging, marketing, dev dashboards)
   * serves valid HTTPS BEFORE enabling.
   */
  includeSubDomains?: boolean | undefined;
  /**
   * Seconds browsers must enforce HTTPS after seeing the header. Default 63072000 (2 years).
   * Preload minimum is 31536000 (1 year). Shorter = safer rollback; longer = stronger protection.
   */
  maxAge?: number | undefined;
  /**
   * Also serve `X-Content-Type-Options: nosniff`. CF bundles it with the security_header
   * setting so it's free to enable. Prevents MIME-type confusion attacks.
   */
  nosniff?: boolean | undefined;
  /**
   * Add the `preload` directive. Required but not sufficient to appear in browsers' built-in
   * preload list — you must also submit the apex manually at https://hstspreload.org (reCAPTCHA-gated,
   * no API). Propagation to stable browser releases takes 4-12 weeks; removal takes 6-12 months.
   * Only enable once every subdomain is permanently HTTPS.
   */
  preload?: boolean | undefined;
};

/**
 * HSTS (RFC 6797) sub-config. Tells compliant browsers to only contact the origin over HTTPS
 * for `maxAge` seconds. Persisted by CF via the `security_header` setting.
 */
export type HstsConfig = {
  /**
   * Serve the `Strict-Transport-Security` response header at the edge. Disabling clears
   * the header — existing browser state still applies until their cached max-age expires.
   */
  enabled: boolean;
  /**
   * Apply HSTS to every subdomain. REQUIRED by the preload list, and one-way in practice:
   * once browsers have seen it, any subdomain served over plain HTTP for those users will hard-fail.
   * Verify every current and planned subdomain (app, api, staging, marketing, dev dashboards)
   * serves valid HTTPS BEFORE enabling.
   */
  includeSubDomains: boolean;
  /**
   * Seconds browsers must enforce HTTPS after seeing the header. Default 63072000 (2 years).
   * Preload minimum is 31536000 (1 year). Shorter = safer rollback; longer = stronger protection.
   */
  maxAge: number;
  /**
   * Also serve `X-Content-Type-Options: nosniff`. CF bundles it with the security_header
   * setting so it's free to enable. Prevents MIME-type confusion attacks.
   */
  nosniff: boolean;
  /**
   * Add the `preload` directive. Required but not sufficient to appear in browsers' built-in
   * preload list — you must also submit the apex manually at https://hstspreload.org (reCAPTCHA-gated,
   * no API). Propagation to stable browser releases takes 4-12 weeks; removal takes 6-12 months.
   * Only enable once every subdomain is permanently HTTPS.
   */
  preload: boolean;
};

/**
 * SSL/TLS edge configuration.
 */
export type SslConfigInput = {
  /**
   * Force HTTP → HTTPS 301 redirect at the edge. Maps to CF `always_use_https`.
   * Should be on whenever your zone is HTTPS-only.
   */
  alwaysHttps?: boolean | undefined;
  /**
   * Rewrite mixed-content `http://` asset URLs to `https://` in served HTML.
   * Maps to CF `automatic_https_rewrites`. Cheap safety net for legacy hardcoded links.
   */
  autoRewrites?: boolean | undefined;
  /**
   * HSTS (Strict-Transport-Security) configuration. See `hstsConfigSchema` for the preload
   * gotchas — this is a one-way door once browsers have cached the header.
   */
  hsts?: HstsConfigInput | undefined;
  /**
   * Reject TLS connections below this version. Maps to CF `min_tls_version`.
   * `1.2` is the PCI-DSS floor and matches modern browser defaults.
   */
  minTls?: "1.0" | "1.1" | "1.2" | "1.3" | undefined;
  /**
   * Enable TLS 1.3 (faster handshake, forward secrecy by default). Maps to CF `tls_1_3`.
   */
  tls13?: boolean | undefined;
};

/**
 * SSL/TLS edge configuration.
 */
export type SslConfig = {
  /**
   * Force HTTP → HTTPS 301 redirect at the edge. Maps to CF `always_use_https`.
   * Should be on whenever your zone is HTTPS-only.
   */
  alwaysHttps: boolean;
  /**
   * Rewrite mixed-content `http://` asset URLs to `https://` in served HTML.
   * Maps to CF `automatic_https_rewrites`. Cheap safety net for legacy hardcoded links.
   */
  autoRewrites: boolean;
  /**
   * HSTS (Strict-Transport-Security) configuration. See `hstsConfigSchema` for the preload
   * gotchas — this is a one-way door once browsers have cached the header.
   */
  hsts: HstsConfig;
  /**
   * Reject TLS connections below this version. Maps to CF `min_tls_version`.
   * `1.2` is the PCI-DSS floor and matches modern browser defaults.
   */
  minTls: "1.0" | "1.1" | "1.2" | "1.3";
  /**
   * Enable TLS 1.3 (faster handshake, forward secrecy by default). Maps to CF `tls_1_3`.
   */
  tls13: boolean;
};
