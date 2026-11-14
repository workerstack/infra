import * as z from "zod";

/**
 * Cache rule — configures browser + edge TTL overrides for matching requests.
 * All rules evaluated in order; first match wins. Null TTL fields leave CF defaults.
 */
export function cacheRuleSchema(): z.ZodType<CacheRule, CacheRuleInput> {
  return z.object({
    /**
     * Seconds the client browser may cache the response (sets `Cache-Control: max-age=...`).
     * Leave unset to let origin's own `Cache-Control` header win. Typical bands:
     * - immutable hashed assets (app.abc123.js): 31536000 (1y) — safe because filename changes on deploy.
     * - static assets (images, fonts without hash): 86400 (1d) — balance freshness vs CDN reach.
     * - HTML pages: 0 or unset — let the page's own Cache-Control / ETag decide.
     * - API responses: usually unset; let the handler set Cache-Control per response.
     */
    browserTtl: z.number().optional(),
    /**
     * Skips the edge cache entirely for matching requests (request still reaches origin).
     * Use for: signed URLs, per-user content, webhooks, anything with `Authorization` / `Cookie`
     * that must not leak across users.
     */
    bypass: z.boolean().default(false),
    /**
     * Protect against Cache Deception attacks where `/account.php/nonexistent.css` tricks
     * the edge into caching a logged-in page as a static asset. On for anything authenticated.
     */
    cacheDeceptionArmor: z.boolean().default(false),
    /** Shown in CF dashboard and infra verify output. */
    description: z.string(),
    /**
     * Seconds CF's edge cache retains the response. Leave unset to honor origin's
     * `Cache-Control` / `s-maxage`. Typical bands (longer is fine because you can purge):
     * - immutable hashed assets: 31536000 (1y) — paired with long browserTtl.
     * - static assets: 604800 (1w) — cheap to evict on deploy via CF purge.
     * - HTML: 300-3600 (5m-1h) — depends on content freshness tolerance.
     * - API responses: 0 for anything user-specific; 60-300 for aggregates/listings.
     *
     * CF's edge TTL can exceed browser TTL — the edge serves a warm cached copy while
     * the client revalidates on its own cadence.
     */
    edgeTtl: z.number().optional(),
    /** Soft-disable without removing from config. */
    enabled: z.boolean().default(true),
    /** Wirefilter match expression, e.g. `starts_with(http.request.uri.path, "/assets/")`. */
    expression: z.string(),
    /**
     * Normalize `?b=2&a=1` and `?a=1&b=2` to the same cache key so they hit the same
     * edge entry. Useful on analytics-tagged URLs (utm_*, fbclid) where query order varies.
     */
    sortQueryString: z.boolean().default(false),
  });
}

/**
 * Cache rule — configures browser + edge TTL overrides for matching requests.
 * All rules evaluated in order; first match wins. Null TTL fields leave CF defaults.
 */
export type CacheRuleInput = {
  /**
   * Seconds the client browser may cache the response (sets `Cache-Control: max-age=...`).
   * Leave unset to let origin's own `Cache-Control` header win. Typical bands:
   * - immutable hashed assets (app.abc123.js): 31536000 (1y) — safe because filename changes on deploy.
   * - static assets (images, fonts without hash): 86400 (1d) — balance freshness vs CDN reach.
   * - HTML pages: 0 or unset — let the page's own Cache-Control / ETag decide.
   * - API responses: usually unset; let the handler set Cache-Control per response.
   */
  browserTtl?: number | undefined;
  /**
   * Skips the edge cache entirely for matching requests (request still reaches origin).
   * Use for: signed URLs, per-user content, webhooks, anything with `Authorization` / `Cookie`
   * that must not leak across users.
   */
  bypass?: boolean | undefined;
  /**
   * Protect against Cache Deception attacks where `/account.php/nonexistent.css` tricks
   * the edge into caching a logged-in page as a static asset. On for anything authenticated.
   */
  cacheDeceptionArmor?: boolean | undefined;
  /** Shown in CF dashboard and infra verify output. */
  description: string;
  /**
   * Seconds CF's edge cache retains the response. Leave unset to honor origin's
   * `Cache-Control` / `s-maxage`. Typical bands (longer is fine because you can purge):
   * - immutable hashed assets: 31536000 (1y) — paired with long browserTtl.
   * - static assets: 604800 (1w) — cheap to evict on deploy via CF purge.
   * - HTML: 300-3600 (5m-1h) — depends on content freshness tolerance.
   * - API responses: 0 for anything user-specific; 60-300 for aggregates/listings.
   *
   * CF's edge TTL can exceed browser TTL — the edge serves a warm cached copy while
   * the client revalidates on its own cadence.
   */
  edgeTtl?: number | undefined;
  /** Soft-disable without removing from config. */
  enabled?: boolean | undefined;
  /** Wirefilter match expression, e.g. `starts_with(http.request.uri.path, "/assets/")`. */
  expression: string;
  /**
   * Normalize `?b=2&a=1` and `?a=1&b=2` to the same cache key so they hit the same
   * edge entry. Useful on analytics-tagged URLs (utm_*, fbclid) where query order varies.
   */
  sortQueryString?: boolean | undefined;
};

/**
 * Cache rule — configures browser + edge TTL overrides for matching requests.
 * All rules evaluated in order; first match wins. Null TTL fields leave CF defaults.
 */
export type CacheRule = {
  /**
   * Seconds the client browser may cache the response (sets `Cache-Control: max-age=...`).
   * Leave unset to let origin's own `Cache-Control` header win. Typical bands:
   * - immutable hashed assets (app.abc123.js): 31536000 (1y) — safe because filename changes on deploy.
   * - static assets (images, fonts without hash): 86400 (1d) — balance freshness vs CDN reach.
   * - HTML pages: 0 or unset — let the page's own Cache-Control / ETag decide.
   * - API responses: usually unset; let the handler set Cache-Control per response.
   */
  browserTtl?: number | undefined;
  /**
   * Skips the edge cache entirely for matching requests (request still reaches origin).
   * Use for: signed URLs, per-user content, webhooks, anything with `Authorization` / `Cookie`
   * that must not leak across users.
   */
  bypass: boolean;
  /**
   * Protect against Cache Deception attacks where `/account.php/nonexistent.css` tricks
   * the edge into caching a logged-in page as a static asset. On for anything authenticated.
   */
  cacheDeceptionArmor: boolean;
  /** Shown in CF dashboard and infra verify output. */
  description: string;
  /**
   * Seconds CF's edge cache retains the response. Leave unset to honor origin's
   * `Cache-Control` / `s-maxage`. Typical bands (longer is fine because you can purge):
   * - immutable hashed assets: 31536000 (1y) — paired with long browserTtl.
   * - static assets: 604800 (1w) — cheap to evict on deploy via CF purge.
   * - HTML: 300-3600 (5m-1h) — depends on content freshness tolerance.
   * - API responses: 0 for anything user-specific; 60-300 for aggregates/listings.
   *
   * CF's edge TTL can exceed browser TTL — the edge serves a warm cached copy while
   * the client revalidates on its own cadence.
   */
  edgeTtl?: number | undefined;
  /** Soft-disable without removing from config. */
  enabled: boolean;
  /** Wirefilter match expression, e.g. `starts_with(http.request.uri.path, "/assets/")`. */
  expression: string;
  /**
   * Normalize `?b=2&a=1` and `?a=1&b=2` to the same cache key so they hit the same
   * edge entry. Useful on analytics-tagged URLs (utm_*, fbclid) where query order varies.
   */
  sortQueryString: boolean;
};
