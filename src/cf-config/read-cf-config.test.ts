import { join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { cleanCopies, copyProduct, seedRegistry } from "./__fixtures__/copy-product.ts";
import { readCfConfig } from "./read-cf-config.ts";

const LOAD_TIMEOUT = 30_000;

afterEach(cleanCopies);

function apiConfig(): string {
  const { product } = copyProduct();

  seedRegistry(product.root);

  return join(product.root, "api/cloudflare.config.ts");
}

it(
  "answers the parsed Worker and its Wrangler config for the scope, under Bun",
  async () => {
    const prod = await readCfConfig(apiConfig(), "prod");

    expect(prod.worker.name).toBe("web-api-prod");
    expect(prod.wrangler).toMatchObject({
      d1_databases: [{ binding: "DB", database_id: "db-prod-id", database_name: "db-prod" }],
      name: "web-api-prod",
      ratelimits: [{ name: "LIMIT_5", namespace_id: "3", simple: { limit: 5, period: 60 } }],
      secrets: { required: ["API_KEY"] },
      vars: { ENVIRONMENT: "prod", GREETING: "hi prod", SITE_URL: "https://example.com/app" },
    });
  },
  LOAD_TIMEOUT,
);

it(
  "evaluates the config once per scope",
  async () => {
    const file = apiConfig();
    const dev = await readCfConfig(file, "dev");
    const local = await readCfConfig(file, "local");

    expect([dev.worker.name, local.worker.name]).toStrictEqual(["web-api-dev", "web-api-local"]);
    expect(dev.wrangler["vars"]).toMatchObject({ GREETING: "hi dev" });
  },
  LOAD_TIMEOUT,
);

it(
  "fails naming the file for a config with no default export, and for a missing rate-limit id",
  async () => {
    const noDefault = join(import.meta.dirname, "__fixtures__/no-default.fixture.ts");
    const { product } = copyProduct();
    const unseeded = join(product.root, "api/cloudflare.config.ts");

    await expect(readCfConfig(noDefault, "prod")).rejects.toThrow(`${noDefault}: does not have a default export`);
    await expect(readCfConfig(unseeded, "prod")).rejects.toThrow(
      `${unseeded}: no rate-limit namespace id for web-api/prod/LIMIT_5; run infra gen`,
    );
  },
  LOAD_TIMEOUT,
);
