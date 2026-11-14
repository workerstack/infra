export { defineInfraConfig } from "./define-infra-config.ts";

export { discoverProducts, INFRA_CONFIG_FILE, selectProducts } from "./products.ts";

export type { Product, ProductTarget, Selection } from "./products.ts";

export type { AppleConfig, AppleOAuthEnv } from "./schema/apple.ts";

export type {
  AiSearchBinding,
  AiSearchInstanceConfig,
  EnvBindings,
  R2BucketConfig,
  R2CorsRule,
} from "./schema/bindings.ts";

export type { CacheRule, CacheRuleInput } from "./schema/cache.ts";

export type {
  CloudflareAccessApplication,
  CloudflareAccessEnv,
  CloudflareAccessGoogleIdP,
  CloudflareAccessServiceToken,
  CloudflareR2Credentials,
  CloudflareTurnstileEnv,
} from "./schema/cloudflare-env.ts";

export type { CloudflareConfig, CloudflareConfigInput } from "./schema/cloudflare.ts";

export type { DnsConfig, DnsConfigInput, DnsRecord, DnsRecordInput } from "./schema/dns.ts";

export type {
  CloudConnectorRule,
  CloudConnectorRuleInput,
  TransformConfig,
  TransformConfigInput,
  TransformRule,
  TransformRuleInput,
} from "./schema/edge-rules.ts";

export type {
  EmailRoutingAction,
  EmailRoutingConfig,
  EmailRoutingConfigInput,
  EmailRoutingRule,
  EmailRoutingRuleInput,
} from "./schema/email-routing.ts";

export type { GoogleConfig, GoogleOAuthEnv, GoogleSearchConsole } from "./schema/google.ts";

export type { InfraConfig, InfraConfigInput, InfraEnv } from "./schema/infra.ts";

export type { LocalConfig } from "./schema/local-config.ts";

export type { MicrosoftConfig, MicrosoftOAuthEnv } from "./schema/microsoft.ts";

export type { RateLimitRule, RateLimitRuleInput } from "./schema/rate-limit.ts";

export type { RedirectConfig, RedirectConfigInput, RedirectRule, RedirectRuleInput } from "./schema/redirects.ts";

export type { AgentReadinessConfig, AgentReadinessConfigInput, SpeedConfig, SpeedConfigInput } from "./schema/speed.ts";

export type { HstsConfig, HstsConfigInput, SslConfig, SslConfigInput } from "./schema/ssl.ts";

export type { WafConfig, WafConfigInput, WafRule, WafRuleInput } from "./schema/waf.ts";

export type { ZoneConfig, ZoneConfigInput } from "./schema/zone.ts";

export { parseZoneConfig } from "./schema/zone.ts";
