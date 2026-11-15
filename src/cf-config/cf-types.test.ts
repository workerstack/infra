import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { cleanCopies, copyProduct, seedRegistry } from "./__fixtures__/copy-product.ts";
import { cfTypes } from "./cf-types.ts";

afterAll(cleanCopies);

describe("cfTypes", () => {
  it("writes a package's .cloudflare/types/index.d.ts through the cf peer", async () => {
    const { product } = copyProduct();
    const dir = join(product.root, "api");

    seedRegistry(product.root);
    await cfTypes(dir, "prod");

    expect(existsSync(join(dir, ".cloudflare/types/index.d.ts"))).toBe(true);
    expect(readFileSync(join(dir, ".cloudflare/types/index.d.ts"), "utf8")).toContain("DB");
  }, 30_000);

  it("names the package when cf fails", async () => {
    const { product } = copyProduct();
    const dir = join(product.root, "db");

    await expect(cfTypes(dir, "local")).rejects.toThrow(`${dir}: cf workers types failed:\n`);
  }, 30_000);
});
