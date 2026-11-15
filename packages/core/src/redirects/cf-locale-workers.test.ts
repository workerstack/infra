import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { cleanCopies, copyProduct, seedRegistry } from "../cf-config/__fixtures__/copy-product.ts";
import { cfLocaleWorkers } from "./cf-locale-workers.ts";

const LOAD_TIMEOUT = 30_000;

afterEach(cleanCopies);

it(
  "reads every cloudflare.config.ts of a product for prod: its dir, deployed name and fetch routes",
  async () => {
    const { product } = copyProduct();

    seedRegistry(product.root);

    expect(await cfLocaleWorkers(product.root)).toStrictEqual([
      { dir: "api", name: "web-api-prod", routes: [{ pattern: "example.com/api/*" }] },
    ]);
  },
  LOAD_TIMEOUT,
);

it("answers no Workers for a product with no cloudflare.config.ts", async () => {
  const root = mkdtempSync(join(tmpdir(), "cf-none-"));

  expect(await cfLocaleWorkers(root)).toStrictEqual([]);
  rmSync(root, { force: true, recursive: true });
});
