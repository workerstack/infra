import * as z from "zod";

import { HTTP_STATUS } from "../http-status.constants.ts";

/**
 * Redirect ruleset — edge 301/302 redirects (no origin request).
 */
export function redirectConfigSchema(): z.ZodType<RedirectConfig, RedirectConfigInput> {
  return z.object({
    /**
     * Worker package dirs (`apps/web`) whose app sends visitors to their locale at the edge: each
     * one's committed `locale-redirects.json` rules are written after `rules`, held to its Worker's
     * prod host and clear of every path another Worker's prod routes claim there.
     */
    locale: z.array(z.string()).default([]),
    /** Custom redirect rules; evaluated in order, first match wins. */
    rules: z
      .array(
        z.object({
          /** Shown in CF dashboard and infra verify output. */
          description: z.string(),
          /** Soft-disable without removing from config. */
          enabled: z.boolean().default(true),
          /** Wirefilter match expression, e.g. `http.request.uri.path eq "/old-path"`. */
          expression: z.string(),
          /** Forward `?foo=bar` to the target URL. Usually `true`. */
          preserveQueryString: z.boolean().default(true),
          /** 301 permanent (SEO-friendly), 302 temporary. Default 301. */
          statusCode: z.number().default(HTTP_STATUS.MOVED_PERMANENTLY),
          /**
           * Wirefilter expression producing the target URL string, e.g.
           * `concat("https://example.com", http.request.uri.path)`.
           */
          targetExpression: z.string(),
        }),
      )
      .default([]),
    /**
     * Auto-generate a `www.{domain}` → apex 301. Saves writing the rule by hand; merged
     * with `rules` at apply time.
     */
    wwwToRoot: z.boolean().default(false),
  });
}

/** One edge redirect rule. */
export type RedirectRuleInput = {
  /** Shown in CF dashboard and infra verify output. */
  description: string;
  /** Soft-disable without removing from config. */
  enabled?: boolean | undefined;
  /** Wirefilter match expression, e.g. `http.request.uri.path eq "/old-path"`. */
  expression: string;
  /** Forward `?foo=bar` to the target URL. Usually `true`. */
  preserveQueryString?: boolean | undefined;
  /** 301 permanent (SEO-friendly), 302 temporary. Default 301. */
  statusCode?: number | undefined;
  /**
   * Wirefilter expression producing the target URL string, e.g.
   * `concat("https://example.com", http.request.uri.path)`.
   */
  targetExpression: string;
};

/** One edge redirect rule. */
export type RedirectRule = {
  /** Shown in CF dashboard and infra verify output. */
  description: string;
  /** Soft-disable without removing from config. */
  enabled: boolean;
  /** Wirefilter match expression, e.g. `http.request.uri.path eq "/old-path"`. */
  expression: string;
  /** Forward `?foo=bar` to the target URL. Usually `true`. */
  preserveQueryString: boolean;
  /** 301 permanent (SEO-friendly), 302 temporary. Default 301. */
  statusCode: number;
  /**
   * Wirefilter expression producing the target URL string, e.g.
   * `concat("https://example.com", http.request.uri.path)`.
   */
  targetExpression: string;
};

/**
 * Redirect ruleset — edge 301/302 redirects (no origin request).
 */
export type RedirectConfigInput = {
  /**
   * Worker package dirs (`apps/web`) whose app sends visitors to their locale at the edge: each
   * one's committed `locale-redirects.json` rules are written after `rules`, held to its Worker's
   * prod host and clear of every path another Worker's prod routes claim there.
   */
  locale?: string[] | undefined;
  /** Custom redirect rules; evaluated in order, first match wins. */
  rules?: RedirectRuleInput[] | undefined;
  /**
   * Auto-generate a `www.{domain}` → apex 301. Saves writing the rule by hand; merged
   * with `rules` at apply time.
   */
  wwwToRoot?: boolean | undefined;
};

/**
 * Redirect ruleset — edge 301/302 redirects (no origin request).
 */
export type RedirectConfig = {
  /**
   * Worker package dirs (`apps/web`) whose app sends visitors to their locale at the edge: each
   * one's committed `locale-redirects.json` rules are written after `rules`, held to its Worker's
   * prod host and clear of every path another Worker's prod routes claim there.
   */
  locale: string[];
  /** Custom redirect rules; evaluated in order, first match wins. */
  rules: RedirectRule[];
  /**
   * Auto-generate a `www.{domain}` → apex 301. Saves writing the rule by hand; merged
   * with `rules` at apply time.
   */
  wwwToRoot: boolean;
};
