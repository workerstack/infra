import type { RedirectRule } from "../operations/redirect-rule.ts";
import type { ZoneConfig } from "../schema/zone.ts";
import { cfLocaleWorkers } from "./cf-locale-workers.ts";
import { localeRules } from "./locale-rules.ts";
import { localeZoneRedirectRules } from "./locale-zone-redirect-rules.ts";

/**
 * The zone's whole redirect list: www, the config's own rules, then the locale rules of the apps it lists, read from
 * the product's `cloudflare.config.ts` files. Every writer of the redirect phase sends this list.
 */
export async function zoneRedirects(productRoot: string, zone: ZoneConfig): Promise<RedirectRule[]> {
  const dirs = zone.redirects.locale;
  const workers = dirs.length === 0 ? [] : await cfLocaleWorkers(productRoot);

  return localeZoneRedirectRules(zone, localeRules({ dirs, productRoot, workers }));
}
