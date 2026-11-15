/** The ruleset phases the zone operations write, by their role. */
export const RULESET_PHASE = {
  CACHE: "http_request_cache_settings",
  DYNAMIC_REDIRECT: "http_request_dynamic_redirect",
  FIREWALL_CUSTOM: "http_request_firewall_custom",
  RATELIMIT: "http_ratelimit",
  TRANSFORM: "http_request_transform",
} as const;
