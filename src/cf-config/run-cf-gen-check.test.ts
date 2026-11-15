import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { logLines } from "../provision/__fixtures__/log-lines.ts";
import { fakeInfraEnv } from "../shared/__fixtures__/fake-infra-env.ts";
import { cleanCopies, copyProduct } from "./__fixtures__/copy-product.ts";
import { fakeTypes } from "./__fixtures__/fake-types.ts";
import { runCfGen } from "./run-cf-gen.ts";

const GEN_TIMEOUT = 30_000;

const { runTypes } = fakeTypes();

afterEach(cleanCopies);

it(
  "under --check writes nothing and fails a package whose rate-limit ids were never given",
  async () => {
    const { product } = copyProduct();
    const { lines, log } = logLines();

    await expect(runCfGen({ check: true, log, product, runTypes })).rejects.toThrow(
      "no rate-limit namespace id for web-api/local/LIMIT_5; run infra gen",
    );
    expect(existsSync(join(product.root, "api/.cloudflare"))).toBe(false);
    expect(existsSync(join(product.root, "ratelimit-ids.json"))).toBe(false);
    expect(lines).toStrictEqual([]);
  },
  GEN_TIMEOUT,
);

it(
  "under --check passes a generated product, and names each file that drifted after",
  async () => {
    const { product } = copyProduct();
    const { log } = logLines();

    await runCfGen({ check: false, log, product, runTypes });
    await expect(runCfGen({ check: true, log, product, runTypes })).resolves.toBeUndefined();

    writeFileSync(join(product.root, "api/.cloudflare/wrangler.dev.json"), "{}\n");
    rmSync(join(product.root, "api/.dev.vars.prod"));

    await expect(runCfGen({ check: true, log, product, runTypes })).rejects.toThrow(
      [
        "apps/web/api/.cloudflare/wrangler.dev.json is out of date; run infra gen",
        "apps/web/api/.dev.vars.prod is out of date; run infra gen",
      ].join("\n"),
    );
  },
  GEN_TIMEOUT,
);

it(
  "types each package it generates in prod, as the product deploys to prod, and none under --check",
  async () => {
    const { product } = copyProduct();
    const types = fakeTypes();

    await runCfGen({ check: false, log: logLines().log, product, runTypes: types.runTypes });
    expect(types.calls).toStrictEqual([[join(product.root, "api"), "prod"]]);

    await runCfGen({ check: true, log: logLines().log, product, runTypes: types.runTypes });
    expect(types.calls).toHaveLength(1);
  },
  GEN_TIMEOUT,
);

it(
  "refuses a product whose app has a locale record its zone doesn't list, before writing anything",
  async () => {
    const { product } = copyProduct();

    writeFileSync(join(product.root, "api/locale-redirects.json"), '{ "rules": [] }');

    await expect(runCfGen({ check: false, log: logLines().log, product, runTypes })).rejects.toThrow(
      'add "api" to cloudflare.zone.redirects.locale',
    );
    expect(existsSync(join(product.root, "api/.cloudflare"))).toBe(false);
  },
  GEN_TIMEOUT,
);

it("does nothing for a product with no cloudflare.config.ts, kit or not", async () => {
  const root = mkdtempSync(join(tmpdir(), "cf-none-"));
  const product = { config: { env: fakeInfraEnv() }, configFile: join(root, "infra.config.ts"), name: ".", root };
  const { lines, log } = logLines();

  await runCfGen({ check: false, log, product, runTypes });
  rmSync(root, { force: true, recursive: true });

  expect(lines).toStrictEqual([]);
});
