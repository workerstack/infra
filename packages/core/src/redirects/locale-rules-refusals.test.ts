import { afterEach, describe, expect, it } from "vitest";

import { appRule, cleanProducts, docs, product, routes, site } from "./__fixtures__/locale-fixtures.ts";
import { localeRules } from "./locale-rules.ts";

afterEach(cleanProducts);

describe("localeRules refusals", () => {
  it("refuses a missing or malformed record, naming the fix", () => {
    const productRoot = product({ "web/docs": { rules: [{ description: 1 }] } });

    expect(() => localeRules({ dirs: ["web/site"], productRoot, workers: [site()] })).toThrow(
      "web/site/locale-redirects.json is missing: build the app and commit it",
    );
    expect(() => localeRules({ dirs: ["web/docs"], productRoot, workers: [docs()] })).toThrow(
      "web/docs/locale-redirects.json is not the framework's record",
    );
  });

  it("refuses a dir no cloudflare.config.ts deploys, and an app on two hosts", () => {
    const productRoot = product({ "web/site": { rules: [appRule] } });
    const twoHosts = { ...site(), routes: routes("h/*", "www.h/*") };

    expect(() => localeRules({ dirs: ["web/site"], productRoot, workers: [docs()] })).toThrow(
      "web/site: no cloudflare.config.ts deploys this dir",
    );
    expect(() => localeRules({ dirs: ["web/site"], productRoot, workers: [twoHosts] })).toThrow(
      "web/site: its prod routes serve 2 hosts (h, www.h); a locale rule is held to one",
    );
  });

  it("refuses a rule longer than a Free plan expression", () => {
    const productRoot = product({
      "web/site": { rules: [{ ...appRule, expression: "x".repeat(4096) }] },
    });

    expect(() => localeRules({ dirs: ["web/site"], productRoot, workers: [site()] })).toThrow(
      /web\/site: rule "framework: locale hr" is \d+ characters; Cloudflare takes 4096/,
    );
  });
});
