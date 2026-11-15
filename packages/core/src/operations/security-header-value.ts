/**
 * CF stores HSTS and nosniff under one setting key with a nested object value.
 * Every field is always sent so CF keeps no stale partial state.
 */
export type SecurityHeaderValue = {
  strict_transport_security: {
    enabled: boolean;
    include_subdomains: boolean;
    max_age: number;
    nosniff: boolean;
    preload: boolean;
  };
};
