import * as z from "zod";

/**
 * Agent-readiness toggles — zone-level settings that make a site discoverable /
 * consumable by AI agents (isitagentready.com checks). Rules-level concerns
 * (Link headers, /.well-known files) stay in the Worker.
 */
export function agentReadinessConfigSchema(): z.ZodType<AgentReadinessConfig, AgentReadinessConfigInput> {
  return z.object({
    /**
     * Enable CF "Markdown for Agents" (zone setting `content_converter`). When on,
     * CF intercepts requests with `Accept: text/markdown`, fetches HTML from the
     * origin, converts, and returns `Content-Type: text/markdown`. Requires Pro+
     * plan on the zone. Origin response ≤ 2 MB.
     */
    markdownForAgents: z.boolean().default(true),
  });
}

/**
 * Speed-related edge toggles.
 */
export function speedConfigSchema(): z.ZodType<SpeedConfig, SpeedConfigInput> {
  return z.object({
    /**
     * Emit 103 Early Hints for CSS/JS/font assets so browsers can start preloading
     * before the 200 response arrives. Maps to CF `early_hints`. Measurably improves LCP.
     *
     * Requires origin to send `Link: <asset>; rel=preload` headers (or use `<link rel="preload">`
     * in HTML — CF scrapes those). Does nothing if origin emits no preload hints.
     */
    earlyHints: z.boolean().default(true),
    /**
     * Route Google Fonts requests through CF's edge for caching + privacy (no client → Google).
     * Maps to CF `fonts`. Requires the site to actually load fonts from `fonts.googleapis.com`.
     */
    fonts: z.boolean().default(true),
  });
}

/**
 * Agent-readiness toggles — zone-level settings that make a site discoverable /
 * consumable by AI agents (isitagentready.com checks). Rules-level concerns
 * (Link headers, /.well-known files) stay in the Worker.
 */
export type AgentReadinessConfigInput = {
  /**
   * Enable CF "Markdown for Agents" (zone setting `content_converter`). When on,
   * CF intercepts requests with `Accept: text/markdown`, fetches HTML from the
   * origin, converts, and returns `Content-Type: text/markdown`. Requires Pro+
   * plan on the zone. Origin response ≤ 2 MB.
   */
  markdownForAgents?: boolean | undefined;
};

/**
 * Agent-readiness toggles — zone-level settings that make a site discoverable /
 * consumable by AI agents (isitagentready.com checks). Rules-level concerns
 * (Link headers, /.well-known files) stay in the Worker.
 */
export type AgentReadinessConfig = {
  /**
   * Enable CF "Markdown for Agents" (zone setting `content_converter`). When on,
   * CF intercepts requests with `Accept: text/markdown`, fetches HTML from the
   * origin, converts, and returns `Content-Type: text/markdown`. Requires Pro+
   * plan on the zone. Origin response ≤ 2 MB.
   */
  markdownForAgents: boolean;
};

/**
 * Speed-related edge toggles.
 */
export type SpeedConfigInput = {
  /**
   * Emit 103 Early Hints for CSS/JS/font assets so browsers can start preloading
   * before the 200 response arrives. Maps to CF `early_hints`. Measurably improves LCP.
   *
   * Requires origin to send `Link: <asset>; rel=preload` headers (or use `<link rel="preload">`
   * in HTML — CF scrapes those). Does nothing if origin emits no preload hints.
   */
  earlyHints?: boolean | undefined;
  /**
   * Route Google Fonts requests through CF's edge for caching + privacy (no client → Google).
   * Maps to CF `fonts`. Requires the site to actually load fonts from `fonts.googleapis.com`.
   */
  fonts?: boolean | undefined;
};

/**
 * Speed-related edge toggles.
 */
export type SpeedConfig = {
  /**
   * Emit 103 Early Hints for CSS/JS/font assets so browsers can start preloading
   * before the 200 response arrives. Maps to CF `early_hints`. Measurably improves LCP.
   *
   * Requires origin to send `Link: <asset>; rel=preload` headers (or use `<link rel="preload">`
   * in HTML — CF scrapes those). Does nothing if origin emits no preload hints.
   */
  earlyHints: boolean;
  /**
   * Route Google Fonts requests through CF's edge for caching + privacy (no client → Google).
   * Maps to CF `fonts`. Requires the site to actually load fonts from `fonts.googleapis.com`.
   */
  fonts: boolean;
};
