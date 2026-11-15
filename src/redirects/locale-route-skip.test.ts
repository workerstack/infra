import { describe, expect, it } from "vitest";

import { PATH, routes } from "./__fixtures__/locale-fixtures.ts";
import { localeRouteSkip } from "./locale-route-skip.ts";

describe("localeRouteSkip", () => {
  it("turns each route on the host into the paths it claims, and ignores other hosts", () => {
    expect(localeRouteSkip("h", [...routes("h/login*", "h/docs/*", "h/docs", "api.h/*", "h/api")])).toStrictEqual([
      `starts_with(${PATH}, "/login")`,
      `starts_with(${PATH}, "/docs/")`,
      `${PATH} eq "/docs"`,
      `${PATH} eq "/api"`,
    ]);
  });

  it.each([
    ["h/*/x", "a wildcard inside its path"],
    ["*h/x", "a wildcard host"],
    ["h/*", "the whole host"],
    ["h", "the whole host"],
  ])("refuses %s, naming why", (pattern, why) => {
    expect(() => localeRouteSkip("h", routes(pattern))).toThrow(`route "${pattern}"`);
    expect(() => localeRouteSkip("h", routes(pattern))).toThrow(why);
  });
});
