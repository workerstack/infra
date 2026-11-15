import { appendFileSync, copyFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { isCfKit } from "../cf-kit/is-cf-kit.ts";
import { cleanCopies, copyProduct } from "./__fixtures__/copy-product.ts";
import { loadProductKit } from "./load-product-kit.ts";

const LOAD_TIMEOUT = 30_000;

afterEach(cleanCopies);

it(
  "imports the kit the product's one *.cf-kit.ts exports",
  async () => {
    const { product } = copyProduct();
    const kit = await loadProductKit(product.root);

    expect(isCfKit(kit)).toBe(true);
    expect(kit.envs).toStrictEqual(["local", "dev", "prod"]);
  },
  LOAD_TIMEOUT,
);

it(
  "fails a product with no kit file, and one with two, naming both",
  async () => {
    const { product } = copyProduct();

    copyFileSync(join(product.root, "web.cf-kit.ts"), join(product.root, "api/a.cf-kit.ts"));
    await expect(loadProductKit(product.root)).rejects.toThrow(
      "2 kits (api/a.cf-kit.ts, web.cf-kit.ts); a product has one",
    );

    rmSync(join(product.root, "api/a.cf-kit.ts"));
    rmSync(join(product.root, "web.cf-kit.ts"));
    await expect(loadProductKit(product.root)).rejects.toThrow("no *.cf-kit.ts; a product with Workers has one");
  },
  LOAD_TIMEOUT,
);

it(
  "fails a kit file that exports no kit, and one that exports two",
  async () => {
    const { product } = copyProduct();
    const file = join(product.root, "web.cf-kit.ts");

    writeFileSync(join(product.root, "empty.cf-kit.ts"), "export const nothing = 1;\n");
    rmSync(file);
    await expect(loadProductKit(product.root)).rejects.toThrow("empty.cf-kit.ts exports no kit");

    const { product: other } = copyProduct();
    const twin = 'export const twin = createCfKit({ config, ratelimitIds: "ids.json" });\n';

    appendFileSync(join(other.root, "web.cf-kit.ts"), twin);
    await expect(loadProductKit(other.root)).rejects.toThrow("web.cf-kit.ts exports 2 kits; a kit file exports one");
  },
  LOAD_TIMEOUT,
);
