import * as z from "zod";

import { cacheRuleSchema } from "./cache.ts";
import type { CacheRule, CacheRuleInput } from "./cache.ts";
import { dnsConfigSchema } from "./dns.ts";
import type { DnsConfig, DnsConfigInput } from "./dns.ts";
import { cloudConnectorRuleSchema, transformConfigSchema } from "./edge-rules.ts";
import type {
  CloudConnectorRule,
  CloudConnectorRuleInput,
  TransformConfig,
  TransformConfigInput,
} from "./edge-rules.ts";
import { emailRoutingConfigSchema } from "./email-routing.ts";
import type { EmailRoutingConfig, EmailRoutingConfigInput } from "./email-routing.ts";
import { rateLimitRuleSchema } from "./rate-limit.ts";
import type { RateLimitRule, RateLimitRuleInput } from "./rate-limit.ts";
import { redirectConfigSchema } from "./redirects.ts";
import type { RedirectConfig, RedirectConfigInput } from "./redirects.ts";
import { agentReadinessConfigSchema, speedConfigSchema } from "./speed.ts";
import type { AgentReadinessConfig, AgentReadinessConfigInput, SpeedConfig, SpeedConfigInput } from "./speed.ts";
import { sslConfigSchema } from "./ssl.ts";
import type { SslConfig, SslConfigInput } from "./ssl.ts";
import { wafConfigSchema } from "./waf.ts";
import type { WafConfig, WafConfigInput } from "./waf.ts";

/**
 * Top-level zone configuration. Describes the full desired state of a Cloudflare zone:
 * WAF, rate limits, redirects, SSL, speed, cache, DNS. Applied atomically per section
 * by `applyZoneConfig`, verified by `verifyZoneConfig`.
 */
function zoneConfigSchema(): z.ZodType<ZoneConfig, ZoneConfigInput> {
  return z.object({
    /** Agent-readiness toggles (Markdown for Agents, future agent-oriented zone settings). */
    agentReadiness: agentReadinessConfigSchema().prefault({}),
    /** Cache rules evaluated in order; first match wins. */
    cache: z.array(cacheRuleSchema()).default([]),
    /** Cloud Connector rules — route paths to S3-compatible buckets, bypasses workers + origin. */
    cloudConnectors: z.array(cloudConnectorRuleSchema()).default([]),
    /** Worker route patterns pinned to `script: null` (suppresses a catch-all worker on these paths). */
    disabledWorkerRoutes: z.array(z.string()).default([]),
    /** DNS records + DNSSEC toggle. */
    dns: dnsConfigSchema().prefault({}),
    /** Apex domain, e.g. `example.com`. Used for auto-generated rules (`wwwToRoot`) + log output. */
    domain: z.string(),
    /** Email Routing custom rules + optional catch-all. */
    emailRouting: emailRoutingConfigSchema().prefault({}),
    /** Rate-limit rules. */
    rateLimit: z.array(rateLimitRuleSchema()).default([]),
    /** Edge redirect ruleset. */
    redirects: redirectConfigSchema().prefault({}),
    /** Speed-related toggles (Early Hints, CF Fonts). */
    speed: speedConfigSchema().prefault({}),
    /** SSL/TLS + HSTS configuration. */
    ssl: sslConfigSchema().prefault({}),
    /** Transform-phase rules (URL rewrites). */
    transforms: transformConfigSchema().prefault({}),
    /** WAF custom rules + built-in scanner-path block. */
    waf: wafConfigSchema().prefault({}),
    /** CF zone ID (32-hex). Found under zone "Overview" in the dashboard. */
    zoneId: z.string(),
  });
}

/**
 * Top-level zone configuration. Describes the full desired state of a Cloudflare zone:
 * WAF, rate limits, redirects, SSL, speed, cache, DNS. Applied atomically per section
 * by `applyZoneConfig`, verified by `verifyZoneConfig`.
 */
export type ZoneConfigInput = {
  /** Agent-readiness toggles (Markdown for Agents, future agent-oriented zone settings). */
  agentReadiness?: AgentReadinessConfigInput | undefined;
  /** Cache rules evaluated in order; first match wins. */
  cache?: CacheRuleInput[] | undefined;
  /** Cloud Connector rules — route paths to S3-compatible buckets, bypasses workers + origin. */
  cloudConnectors?: CloudConnectorRuleInput[] | undefined;
  /** Worker route patterns pinned to `script: null` (suppresses a catch-all worker on these paths). */
  disabledWorkerRoutes?: string[] | undefined;
  /** DNS records + DNSSEC toggle. */
  dns?: DnsConfigInput | undefined;
  /** Apex domain, e.g. `example.com`. Used for auto-generated rules (`wwwToRoot`) + log output. */
  domain: string;
  /** Email Routing custom rules + optional catch-all. */
  emailRouting?: EmailRoutingConfigInput | undefined;
  /** Rate-limit rules. */
  rateLimit?: RateLimitRuleInput[] | undefined;
  /** Edge redirect ruleset. */
  redirects?: RedirectConfigInput | undefined;
  /** Speed-related toggles (Early Hints, CF Fonts). */
  speed?: SpeedConfigInput | undefined;
  /** SSL/TLS + HSTS configuration. */
  ssl?: SslConfigInput | undefined;
  /** Transform-phase rules (URL rewrites). */
  transforms?: TransformConfigInput | undefined;
  /** WAF custom rules + built-in scanner-path block. */
  waf?: WafConfigInput | undefined;
  /** CF zone ID (32-hex). Found under zone "Overview" in the dashboard. */
  zoneId: string;
};

/**
 * Top-level zone configuration. Describes the full desired state of a Cloudflare zone:
 * WAF, rate limits, redirects, SSL, speed, cache, DNS. Applied atomically per section
 * by `applyZoneConfig`, verified by `verifyZoneConfig`.
 */
export type ZoneConfig = {
  /** Agent-readiness toggles (Markdown for Agents, future agent-oriented zone settings). */
  agentReadiness: AgentReadinessConfig;
  /** Cache rules evaluated in order; first match wins. */
  cache: CacheRule[];
  /** Cloud Connector rules — route paths to S3-compatible buckets, bypasses workers + origin. */
  cloudConnectors: CloudConnectorRule[];
  /** Worker route patterns pinned to `script: null` (suppresses a catch-all worker on these paths). */
  disabledWorkerRoutes: string[];
  /** DNS records + DNSSEC toggle. */
  dns: DnsConfig;
  /** Apex domain, e.g. `example.com`. Used for auto-generated rules (`wwwToRoot`) + log output. */
  domain: string;
  /** Email Routing custom rules + optional catch-all. */
  emailRouting: EmailRoutingConfig;
  /** Rate-limit rules. */
  rateLimit: RateLimitRule[];
  /** Edge redirect ruleset. */
  redirects: RedirectConfig;
  /** Speed-related toggles (Early Hints, CF Fonts). */
  speed: SpeedConfig;
  /** SSL/TLS + HSTS configuration. */
  ssl: SslConfig;
  /** Transform-phase rules (URL rewrites). */
  transforms: TransformConfig;
  /** WAF custom rules + built-in scanner-path block. */
  waf: WafConfig;
  /** CF zone ID (32-hex). Found under zone "Overview" in the dashboard. */
  zoneId: string;
};

/** Parse a zone config, filling every default; throws one `cloudflare.zone.<path>: <message>` line per issue. */
export function parseZoneConfig(input: ZoneConfigInput): ZoneConfig {
  const result = zoneConfigSchema().safeParse(input);

  if (result.success) return result.data;

  const lines = result.error.issues.map(
    (issue) => `${["cloudflare.zone", ...issue.path.map(String)].join(".")}: ${issue.message}`,
  );

  throw new Error(lines.join("\n"));
}
