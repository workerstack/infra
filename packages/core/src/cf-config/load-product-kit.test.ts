import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { isCfKit } from "../cf-kit/is-cf-kit.ts";
import { cleanCopies, copyProduct } from "./__fixtures__/copy-product.ts";
import { loadProductKit } from "./load-product-kit.ts";

const LOAD_TIMEOUT = 30_000;

afterEach(cleanCopies);

it(
  "takes the kit infra.config.ts default-exports, its registry at the product root",
  async () => {
    const { product } = copyProduct();
    const kit = await loadProductKit(product.root);

    expect(isCfKit(kit)).toBe(true);
    expect(kit.envs).toStrictEqual(["local", "dev", "prod"]);
    expect(kit.ratelimitFile()).toBe(join(product.root, "ratelimit-ids.json"));
  },
  LOAD_TIMEOUT,
);

it(
  "fails a leftover kit file, naming the move",
  async () => {
    const { product } = copyProduct();

    writeFileSync(join(product.root, "web.cf-kit.ts"), "export const kit = {};\n");
    await expect(loadProductKit(product.root)).rejects.toThrow(
      "web.cf-kit.ts: the kit is built by defineInfraConfig now; " +
        "move its options to cloudflare.workers in infra.config.ts and delete the file",
    );
  },
  LOAD_TIMEOUT,
);

it(
  "fails an infra.config.ts whose default export is no kit",
  async () => {
    const { product } = copyProduct();

    writeFileSync(join(product.root, "infra.config.ts"), "export default { env: {} };\n");
    await expect(loadProductKit(product.root)).rejects.toThrow(
      "infra.config.ts: default export is not what defineInfraConfig returns; " +
        "export default defineInfraConfig({ ... })",
    );
  },
  LOAD_TIMEOUT,
);
