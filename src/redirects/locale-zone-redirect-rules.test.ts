import { describe, expect, it } from "vitest";

import type { RedirectRule } from "../operations/redirect-rule.ts";
import { parseZoneConfig } from "../schema/zone.ts";
import { PATH, appRule } from "./__fixtures__/locale-fixtures.ts";
import { localeZoneRedirectRules } from "./locale-zone-redirect-rules.ts";

const old = { ...appRule, description: "old", enabled: false, statusCode: 301 };
const locale: RedirectRule = { ...appRule, enabled: true };

function configOf(redirects: { wwwToRoot: boolean }): ReturnType<typeof parseZoneConfig> {
  return parseZoneConfig({
    domain: "x.dev",
    redirects: { rules: [old], ...redirects },
    zoneId: "zid",
  });
}

describe("localeZoneRedirectRules", () => {
  it("orders www, the config's own rules (a disabled one kept off), then the locale rules", () => {
    expect(localeZoneRedirectRules(configOf({ wwwToRoot: true }), [locale])).toStrictEqual([
      {
        description: "WWW to root redirect",
        enabled: true,
        expression: '(http.host eq "www.x.dev")',
        preserveQueryString: true,
        statusCode: 301,
        targetExpression: `concat("https://x.dev", ${PATH})`,
      },
      old,
      locale,
    ]);
  });

  it("states no www rule when the config asks for none", () => {
    expect(localeZoneRedirectRules(configOf({ wwwToRoot: false }), [])).toStrictEqual([old]);
  });
});
