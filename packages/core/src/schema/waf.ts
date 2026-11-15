import * as z from "zod";

/**
 * WAF custom rule — evaluated in order before any managed ruleset. Expressions use
 * Cloudflare's wirefilter syntax (same DSL as the dashboard's Expression Editor).
 */
function wafRuleSchema(): z.ZodType<WafRule, WafRuleInput> {
  return z.object({
    /**
     * What to do when the expression matches.
     * - `block` — hard 403 at the edge.
     * - `managed_challenge` — CF's heuristic mix of CAPTCHA / silent pass (preferred for humans).
     * - `js_challenge` — runs a browser check (breaks API clients).
     * - `challenge` — legacy interactive CAPTCHA.
     * - `log` — records a hit but lets the request through (use during rollout to observe).
     */
    action: z.enum(["block", "managed_challenge", "js_challenge", "challenge", "log"]),
    /** Shown in CF dashboard and infra verify output — make it specific enough to grep. */
    description: z.string(),
    /**
     * Soft-disable without removing. Prefer this over deletion during incident rollback,
     * A/B tuning, or when you want the expression preserved in git history for the next
     * on-call who needs to understand why it existed.
     */
    enabled: z.boolean().default(true),
    /** Wirefilter expression, e.g. `http.request.uri.path contains "/.env"`. */
    expression: z.string(),
  });
}

// The zone config, input and parsed: hand-written so the exported types never name a zod schema.
/**
 * WAF custom rule — evaluated in order before any managed ruleset. Expressions use
 * Cloudflare's wirefilter syntax (same DSL as the dashboard's Expression Editor).
 */
export type WafRuleInput = {
  /**
   * What to do when the expression matches.
   * - `block` — hard 403 at the edge.
   * - `managed_challenge` — CF's heuristic mix of CAPTCHA / silent pass (preferred for humans).
   * - `js_challenge` — runs a browser check (breaks API clients).
   * - `challenge` — legacy interactive CAPTCHA.
   * - `log` — records a hit but lets the request through (use during rollout to observe).
   */
  action: "block" | "managed_challenge" | "js_challenge" | "challenge" | "log";
  /** Shown in CF dashboard and infra verify output — make it specific enough to grep. */
  description: string;
  /**
   * Soft-disable without removing. Prefer this over deletion during incident rollback,
   * A/B tuning, or when you want the expression preserved in git history for the next
   * on-call who needs to understand why it existed.
   */
  enabled?: boolean | undefined;
  /** Wirefilter expression, e.g. `http.request.uri.path contains "/.env"`. */
  expression: string;
};

/**
 * WAF custom rule — evaluated in order before any managed ruleset. Expressions use
 * Cloudflare's wirefilter syntax (same DSL as the dashboard's Expression Editor).
 */
export type WafRule = {
  /**
   * What to do when the expression matches.
   * - `block` — hard 403 at the edge.
   * - `managed_challenge` — CF's heuristic mix of CAPTCHA / silent pass (preferred for humans).
   * - `js_challenge` — runs a browser check (breaks API clients).
   * - `challenge` — legacy interactive CAPTCHA.
   * - `log` — records a hit but lets the request through (use during rollout to observe).
   */
  action: "block" | "managed_challenge" | "js_challenge" | "challenge" | "log";
  /** Shown in CF dashboard and infra verify output — make it specific enough to grep. */
  description: string;
  /**
   * Soft-disable without removing. Prefer this over deletion during incident rollback,
   * A/B tuning, or when you want the expression preserved in git history for the next
   * on-call who needs to understand why it existed.
   */
  enabled: boolean;
  /** Wirefilter expression, e.g. `http.request.uri.path contains "/.env"`. */
  expression: string;
};

/**
 * WAF ruleset — custom rules plus built-in scanner-path protection.
 */
export function wafConfigSchema(): z.ZodType<WafConfig, WafConfigInput> {
  return z.object({
    /** Custom rules evaluated in order; first match wins. */
    rules: z.array(wafRuleSchema()).default([]),
    /**
     * Block the built-in 41-path scanner list (.env, .git, wp-admin, phpmyadmin, actuator,
     * xmlrpc.php, etc.).
     * - `true` — default list.
     * - `false` — disabled.
     * - `{ extra: [...] }` — default list + your additional paths.
     */
    scannerBlock: z
      .union([
        z.boolean(),
        z.object({
          /** Extra path literals appended to the default 41-path block list. */
          extra: z.array(z.string()).default([]),
        }),
      ])
      .default(true),
  });
}

/**
 * WAF ruleset — custom rules plus built-in scanner-path protection.
 */
export type WafConfigInput = {
  /** Custom rules evaluated in order; first match wins. */
  rules?: WafRuleInput[] | undefined;
  /**
   * Block the built-in 41-path scanner list (.env, .git, wp-admin, phpmyadmin, actuator,
   * xmlrpc.php, etc.).
   * - `true` — default list.
   * - `false` — disabled.
   * - `{ extra: [...] }` — default list + your additional paths.
   */
  scannerBlock?:
    | boolean
    | {
        /** Paths to block on top of the default list. */
        extra?: string[] | undefined;
      }
    | undefined;
};

/**
 * WAF ruleset — custom rules plus built-in scanner-path protection.
 */
export type WafConfig = {
  /** Custom rules evaluated in order; first match wins. */
  rules: WafRule[];
  /**
   * Block the built-in 41-path scanner list (.env, .git, wp-admin, phpmyadmin, actuator,
   * xmlrpc.php, etc.).
   * - `true` — default list.
   * - `false` — disabled.
   * - `{ extra: [...] }` — default list + your additional paths.
   */
  scannerBlock:
    | boolean
    | {
        /** Paths to block on top of the default list. */
        extra: string[];
      };
};
