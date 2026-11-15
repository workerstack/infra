import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { logLines } from "../provision/__fixtures__/log-lines.ts";
import { cleanCopies, copyProduct } from "./__fixtures__/copy-product.ts";
import { fakeTypes } from "./__fixtures__/fake-types.ts";
import { jsonObjectSchema } from "./json-object-schema.ts";
import type { JsonObject } from "./json-object.ts";
import { runCfGen } from "./run-cf-gen.ts";

const GEN_TIMEOUT = 30_000;

const { runTypes } = fakeTypes();

afterEach(cleanCopies);

function json(file: string): JsonObject {
  return jsonObjectSchema().parse(JSON.parse(readFileSync(file, "utf8")));
}

const LONG_WORKER = `import { defineConfig } from "cf/config";

import infra from "../infra.config.ts";

export default defineConfig(({ mode }) => ({
  worker: {
    compatibilityDate: "2026-01-20",
    entrypoint: "./src/index.ts",
    name: infra.name("web-api", infra.scope(mode)),
  },
}));
`;

function shortWorker(options: string): string {
  return `import infra from "../infra.config.ts";

export default infra.worker("web-api", {
  compatibilityDate: "2026-01-20",
  entrypoint: "./src/index.ts",
  ${options}
});
`;
}

const SCOPES = ["dev", "local", "prod"];

function wranglerOf(root: string, scope: string): JsonObject {
  return json(join(root, `api/.cloudflare/wrangler.${scope}.json`));
}

it(
  "gives an infra.worker package with no setting and no wrangler.config.ts minify: true in each scope",
  async () => {
    const { product } = copyProduct();

    rmSync(join(product.root, "api/wrangler.config.ts"));
    writeFileSync(join(product.root, "api/cloudflare.config.ts"), shortWorker(""));
    await runCfGen({ check: false, log: logLines().log, product, runTypes });

    for (const scope of SCOPES) {
      expect(wranglerOf(product.root, scope)).toMatchObject({ minify: true });
      expect(wranglerOf(product.root, scope)).not.toHaveProperty("upload_source_maps");
    }
  },
  GEN_TIMEOUT,
);

it(
  "gives a long-form defineConfig package with no wrangler.config.ts minify: true in each scope",
  async () => {
    const { product } = copyProduct();

    rmSync(join(product.root, "api/wrangler.config.ts"));
    writeFileSync(join(product.root, "api/cloudflare.config.ts"), LONG_WORKER);
    await runCfGen({ check: false, log: logLines().log, product, runTypes });

    for (const scope of SCOPES) expect(wranglerOf(product.root, scope)).toMatchObject({ minify: true });
  },
  GEN_TIMEOUT,
);

it(
  "writes minify: false from infra.worker with no wrangler.config.ts",
  async () => {
    const { product } = copyProduct();

    rmSync(join(product.root, "api/wrangler.config.ts"));
    writeFileSync(join(product.root, "api/cloudflare.config.ts"), shortWorker("minify: false,"));
    await runCfGen({ check: false, log: logLines().log, product, runTypes });

    for (const scope of SCOPES) expect(wranglerOf(product.root, scope)).toMatchObject({ minify: false });
  },
  GEN_TIMEOUT,
);

it(
  "resolves assetsDirectory against the package and maps uploadSourceMaps from infra.worker",
  async () => {
    const { product } = copyProduct();

    rmSync(join(product.root, "api/wrangler.config.ts"));
    writeFileSync(
      join(product.root, "api/cloudflare.config.ts"),
      shortWorker('assetsDirectory: "./public", uploadSourceMaps: true,'),
    );
    await runCfGen({ check: false, log: logLines().log, product, runTypes });

    expect(wranglerOf(product.root, "prod")).toMatchObject({
      assets: { directory: join(product.root, "api/public") },
      minify: true,
      upload_source_maps: true,
    });
  },
  GEN_TIMEOUT,
);

it(
  "gives routes that differ by scope from a scope callback",
  async () => {
    const { product } = copyProduct();

    rmSync(join(product.root, "api/wrangler.config.ts"));
    writeFileSync(
      join(product.root, "api/cloudflare.config.ts"),
      `import infra from "../infra.config.ts";

export default infra.worker("web-api", (scope) => ({
  compatibilityDate: "2026-01-20",
  entrypoint: "./src/index.ts",
  ...(scope === "prod" ? { routes: ["example.com/api/*"] } : {}),
}));
`,
    );
    await runCfGen({ check: false, log: logLines().log, product, runTypes });

    expect(wranglerOf(product.root, "prod")["routes"]).toStrictEqual([
      { pattern: "example.com/api/*", zone_name: "example.com" },
    ]);
    expect(wranglerOf(product.root, "dev")).not.toHaveProperty("routes");
  },
  GEN_TIMEOUT,
);

it(
  "fails a package whose infra.worker sets a build key and that has a wrangler.config.ts, naming both files",
  async () => {
    const { product } = copyProduct();

    writeFileSync(join(product.root, "api/cloudflare.config.ts"), shortWorker("minify: false,"));

    const failure = runCfGen({ check: false, log: logLines().log, product, runTypes });

    await expect(failure).rejects.toThrow("cloudflare.config.ts");
    await expect(runCfGen({ check: false, log: logLines().log, product, runTypes })).rejects.toThrow(
      "wrangler.config.ts",
    );
  },
  GEN_TIMEOUT,
);

it(
  "still reads wrangler.config.ts for a long-form package",
  async () => {
    const { product } = copyProduct();

    writeFileSync(join(product.root, "api/cloudflare.config.ts"), LONG_WORKER);
    writeFileSync(
      join(product.root, "api/wrangler.config.ts"),
      "export default { minify: false, uploadSourceMaps: true };\n",
    );
    await runCfGen({ check: false, log: logLines().log, product, runTypes });

    expect(wranglerOf(product.root, "prod")).toMatchObject({ minify: false, upload_source_maps: true });
  },
  GEN_TIMEOUT,
);
