import * as z from "zod";

const RATE_LIMIT_PERIOD_S = 10;

/** Cloudflare rate-limit `mitigation_timeout` default, in seconds. */
const MITIGATION_TIMEOUT_S = 10;

/**
 * Rate-limit rule — throttles when `requestsPerPeriod` is exceeded within `period` seconds,
 * then blocks for `mitigationTimeout` seconds.
 *
 * Counter key is per client IP by default. CF derives the source from `cf-connecting-ip`,
 * so trusted proxy chains are transparent. To bucket by something other than IP (e.g. per
 * API key), scope the expression with a header match — CF still counts per source, but
 * the rule only *considers* requests that match the expression.
 *
 * Legal `period` values on the standard plan: 10, 60, 120, 300, 600, 3600, 86400 seconds.
 * Other values silently round.
 */
export function rateLimitRuleSchema(): z.ZodType<RateLimitRule, RateLimitRuleInput> {
  return z.object({
    /** Shown in CF dashboard and infra verify output. */
    description: z.string(),
    /** Soft-disable without removing from config. */
    enabled: z.boolean().default(true),
    /**
     * Wirefilter expression identifying the request bucket, e.g. `http.request.uri.path eq "/api/login"`.
     * Only matching requests are counted; everything else passes through untouched.
     */
    expression: z.string(),
    /**
     * Seconds to keep blocking once the threshold is breached. Default 10.
     * Guidance: use `period` for most cases, raise `mitigationTimeout` for hostile traffic
     * you want out of the edge for longer (e.g. 600 for clear brute-force patterns).
     */
    mitigationTimeout: z.number().default(MITIGATION_TIMEOUT_S),
    /**
     * Counting window in seconds. Default 10. Must be one of the CF-supported values
     * (see the schema-level doc above).
     */
    period: z.number().default(RATE_LIMIT_PERIOD_S),
    /**
     * Max requests per `period` before the rule triggers. Starting points by endpoint class:
     * - login / password reset: 5 per 60s — tight, blocks credential stuffing.
     * - checkout / payment submit: 10 per 60s — accommodates retries without inviting abuse.
     * - search / autocomplete: 30 per 10s — interactive typing bursts.
     * - public read API: 60-120 per 10s per IP — generous, protects origin from scrapers.
     * - signup: 3 per 3600s — accounts are cheap to create, abuse is not.
     *
     * Too-tight limits lock out NAT'd corporate IPs. Log-only (`action: "log"`) for a week
     * before enforcing to calibrate against real traffic.
     */
    requestsPerPeriod: z.number(),
  });
}

/**
 * Rate-limit rule — throttles when `requestsPerPeriod` is exceeded within `period` seconds,
 * then blocks for `mitigationTimeout` seconds.
 *
 * Counter key is per client IP by default. CF derives the source from `cf-connecting-ip`,
 * so trusted proxy chains are transparent. To bucket by something other than IP (e.g. per
 * API key), scope the expression with a header match — CF still counts per source, but
 * the rule only *considers* requests that match the expression.
 *
 * Legal `period` values on the standard plan: 10, 60, 120, 300, 600, 3600, 86400 seconds.
 * Other values silently round.
 */
export type RateLimitRuleInput = {
  /** Shown in CF dashboard and infra verify output. */
  description: string;
  /** Soft-disable without removing from config. */
  enabled?: boolean | undefined;
  /**
   * Wirefilter expression identifying the request bucket, e.g. `http.request.uri.path eq "/api/login"`.
   * Only matching requests are counted; everything else passes through untouched.
   */
  expression: string;
  /**
   * Seconds to keep blocking once the threshold is breached. Default 10.
   * Guidance: use `period` for most cases, raise `mitigationTimeout` for hostile traffic
   * you want out of the edge for longer (e.g. 600 for clear brute-force patterns).
   */
  mitigationTimeout?: number | undefined;
  /**
   * Counting window in seconds. Default 10. Must be one of the CF-supported values
   * (see the schema-level doc above).
   */
  period?: number | undefined;
  /**
   * Max requests per `period` before the rule triggers. Starting points by endpoint class:
   * - login / password reset: 5 per 60s — tight, blocks credential stuffing.
   * - checkout / payment submit: 10 per 60s — accommodates retries without inviting abuse.
   * - search / autocomplete: 30 per 10s — interactive typing bursts.
   * - public read API: 60-120 per 10s per IP — generous, protects origin from scrapers.
   * - signup: 3 per 3600s — accounts are cheap to create, abuse is not.
   *
   * Too-tight limits lock out NAT'd corporate IPs. Log-only (`action: "log"`) for a week
   * before enforcing to calibrate against real traffic.
   */
  requestsPerPeriod: number;
};

/**
 * Rate-limit rule — throttles when `requestsPerPeriod` is exceeded within `period` seconds,
 * then blocks for `mitigationTimeout` seconds.
 *
 * Counter key is per client IP by default. CF derives the source from `cf-connecting-ip`,
 * so trusted proxy chains are transparent. To bucket by something other than IP (e.g. per
 * API key), scope the expression with a header match — CF still counts per source, but
 * the rule only *considers* requests that match the expression.
 *
 * Legal `period` values on the standard plan: 10, 60, 120, 300, 600, 3600, 86400 seconds.
 * Other values silently round.
 */
export type RateLimitRule = {
  /** Shown in CF dashboard and infra verify output. */
  description: string;
  /** Soft-disable without removing from config. */
  enabled: boolean;
  /**
   * Wirefilter expression identifying the request bucket, e.g. `http.request.uri.path eq "/api/login"`.
   * Only matching requests are counted; everything else passes through untouched.
   */
  expression: string;
  /**
   * Seconds to keep blocking once the threshold is breached. Default 10.
   * Guidance: use `period` for most cases, raise `mitigationTimeout` for hostile traffic
   * you want out of the edge for longer (e.g. 600 for clear brute-force patterns).
   */
  mitigationTimeout: number;
  /**
   * Counting window in seconds. Default 10. Must be one of the CF-supported values
   * (see the schema-level doc above).
   */
  period: number;
  /**
   * Max requests per `period` before the rule triggers. Starting points by endpoint class:
   * - login / password reset: 5 per 60s — tight, blocks credential stuffing.
   * - checkout / payment submit: 10 per 60s — accommodates retries without inviting abuse.
   * - search / autocomplete: 30 per 10s — interactive typing bursts.
   * - public read API: 60-120 per 10s per IP — generous, protects origin from scrapers.
   * - signup: 3 per 3600s — accounts are cheap to create, abuse is not.
   *
   * Too-tight limits lock out NAT'd corporate IPs. Log-only (`action: "log"`) for a week
   * before enforcing to calibrate against real traffic.
   */
  requestsPerPeriod: number;
};
