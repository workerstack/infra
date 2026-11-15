import { HTTP_STATUS } from "../http-status.constants.ts";
import type { RedirectRule } from "../operations/redirect-rule.ts";
import type { ZoneConfig } from "../schema/zone.ts";
import { LOCALE_PATH } from "./locale-path.constants.ts";

function wwwRules(config: ZoneConfig): RedirectRule[] {
  if (!config.redirects.wwwToRoot) return [];

  return [
    {
      description: "WWW to root redirect",
      enabled: true,
      expression: `(http.host eq "www.${config.domain}")`,
      preserveQueryString: true,
      statusCode: HTTP_STATUS.MOVED_PERMANENTLY,
      targetExpression: `concat("https://${config.domain}", ${LOCALE_PATH})`,
    },
  ];
}

/** The zone's whole redirect list, in the order the edge reads it: www, its own rules, locale. */
export function localeZoneRedirectRules(config: ZoneConfig, locale: readonly RedirectRule[]): RedirectRule[] {
  return [...wwwRules(config), ...config.redirects.rules, ...locale];
}
