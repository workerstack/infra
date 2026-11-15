/** The `action_parameters` of a `set_cache_settings` rule. */
export type CacheActionParameters = {
  browser_ttl?: { default: number; mode: string };
  cache: boolean;
  cache_key?: { cache_deception_armor?: boolean; ignore_query_strings_order?: boolean };
  edge_ttl?: { default: number; mode: string };
};
