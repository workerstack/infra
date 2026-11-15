import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { cleanCopies, copyProduct, seedRegistry } from "../cf-config/__fixtures__/copy-product.ts";
import { checkLocaleRedirects } from "./check-locale-redirects.ts";
import { LOCALE_RECORD } from "./locale-record.constants.ts";

const LOAD_TIMEOUT = 30_000;

afterEach(cleanCopies);

function seeded(): string {
  const { product } = copyProduct();

  seedRegistry(product.root);

  return product.root;
}

it(
  "refuses an app with a locale record that its zone doesn't list, naming the entry to add",
  async () => {
    const productRoot = seeded();

    writeFileSync(join(productRoot, "api", LOCALE_RECORD), JSON.stringify({ rules: [] }));

    await expect(checkLocaleRedirects({ listed: [], productRoot })).rejects.toThrow(
      `api/${LOCALE_RECORD}: the app sends visitors to their locale at the edge, ` +
        `but its zone config doesn't list it; add "api" to cloudflare.zone.redirects.locale`,
    );
  },
  LOAD_TIMEOUT,
);

it(
  "builds the listed apps' rules, failing one with no record or no Worker, and passes a product that lists none",
  async () => {
    const productRoot = seeded();

    await expect(checkLocaleRedirects({ listed: [], productRoot })).resolves.toBeUndefined();
    await expect(checkLocaleRedirects({ listed: ["api"], productRoot })).rejects.toThrow(`api/${LOCALE_RECORD}`);
    await expect(checkLocaleRedirects({ listed: ["web"], productRoot })).rejects.toThrow(
      "web: no cloudflare.config.ts deploys this dir",
    );
  },
  LOAD_TIMEOUT,
);
