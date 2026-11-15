/** The ruleset rule actions the zone operations write. */
export const RULESET_ACTION = {
  BLOCK: "block",
  REDIRECT: "redirect",
  REWRITE: "rewrite",
  SET_CACHE_SETTINGS: "set_cache_settings",
} as const;
