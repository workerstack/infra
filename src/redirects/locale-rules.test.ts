import { afterEach, describe, expect, it } from "vitest";

import { PATH, appRule, cleanProducts, docs, product, sharer, site } from "./__fixtures__/locale-fixtures.ts";
import { localeRules } from "./locale-rules.ts";

const SKIP_DOCS = `not (${PATH} eq "/docs" or starts_with(${PATH}, "/docs/"))`;

afterEach(cleanProducts);

describe("localeRules holding", () => {
  it("holds the app's rule to its host, clear of every other Worker's paths there", () => {
    const productRoot = product({ "web/site": { edge: {}, rules: [appRule] } });
    const [rule] = localeRules({ dirs: ["web/site"], productRoot, workers: [site(), docs(), sharer()] });

    expect(rule).toStrictEqual({
      ...appRule,
      enabled: true,
      expression: `http.host eq "h" and ${SKIP_DOCS} and (${appRule.expression})`,
    });
  });

  it("states a path two other Workers claim once (a package sharing a Worker)", () => {
    const productRoot = product({ "web/site": { rules: [appRule] } });
    const docsV0 = { ...docs(), dir: "web/docs_v0" };
    const [rule] = localeRules({ dirs: ["web/site"], productRoot, workers: [site(), docs(), docsV0] });

    expect(rule?.expression).toBe(`http.host eq "h" and ${SKIP_DOCS} and (${appRule.expression})`);
  });

  it("states no skip when no other Worker serves the host", () => {
    const productRoot = product({ "web/site": { rules: [appRule] } });
    const [rule] = localeRules({ dirs: ["web/site"], productRoot, workers: [site()] });

    expect(rule?.expression).toBe(`http.host eq "h" and (${appRule.expression})`);
  });
});
