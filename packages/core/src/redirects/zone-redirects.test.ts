import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { cleanCopies, copyProduct, seedRegistry } from "../cf-config/__fixtures__/copy-product.ts";
import { zoneConfig } from "../runner/__fixtures__/zone-config.ts";
import { appRule } from "./__fixtures__/locale-fixtures.ts";
import { LOCALE_RECORD } from "./locale-record.constants.ts";
import { zoneRedirects } from "./zone-redirects.ts";

const LOAD_TIMEOUT = 30_000;

afterEach(cleanCopies);

it("is the zone's own list when it lists no locale app, without reading any Worker", async () => {
  const zone = zoneConfig({ redirects: { wwwToRoot: true } });
  const rules = await zoneRedirects("/nowhere", zone);

  expect(rules.map((rule) => rule.description)).toStrictEqual(["WWW to root redirect"]);
});

it(
  "adds each listed app's locale rules, held to its Worker's host, after the zone's own",
  async () => {
    const { product } = copyProduct();

    seedRegistry(product.root);
    writeFileSync(join(product.root, "api", LOCALE_RECORD), JSON.stringify({ rules: [appRule] }));

    const rules = await zoneRedirects(product.root, zoneConfig({ redirects: { locale: ["api"], wwwToRoot: true } }));

    expect(rules.map((rule) => rule.description)).toStrictEqual(["WWW to root redirect", appRule.description]);
    expect(rules[1]?.expression).toContain('http.host eq "example.com"');
  },
  LOAD_TIMEOUT,
);
