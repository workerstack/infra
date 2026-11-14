import type { CacheRule } from "../schema/cache.ts";
import type { CacheActionParameters } from "./cache-action-parameters.ts";
import { CACHE_KEY_FIELD } from "./cache-key-field.constants.ts";
import { CACHE_OVERRIDE_MODE } from "./cache-override-mode.constants.ts";

/** The `action_parameters` for one cache rule: a bypass, or caching with only the fields the rule sets. */
export function cacheParametersOf(rule: CacheRule): CacheActionParameters {
  if (rule.bypass) return { cache: false };

  const parameters: CacheActionParameters = { cache: true };

  if (rule.edgeTtl !== undefined) parameters.edge_ttl = { default: rule.edgeTtl, mode: CACHE_OVERRIDE_MODE };

  if (rule.browserTtl !== undefined) parameters.browser_ttl = { default: rule.browserTtl, mode: CACHE_OVERRIDE_MODE };

  if (rule.sortQueryString || rule.cacheDeceptionArmor) {
    parameters.cache_key = {
      ...(rule.sortQueryString ? { [CACHE_KEY_FIELD.IGNORE_QUERY_ORDER]: true } : {}),
      ...(rule.cacheDeceptionArmor ? { [CACHE_KEY_FIELD.DECEPTION_ARMOR]: true } : {}),
    };
  }

  return parameters;
}
