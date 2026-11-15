import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, it } from "vitest";

import { readBundlerSettings } from "./read-bundler-settings.ts";

const FIXTURES = join(import.meta.dirname, "__fixtures__");
const LOAD_TIMEOUT = 30_000;

it(
  "reads a package's wrangler.config.ts, and answers {} for a package with none",
  async () => {
    expect(await readBundlerSettings(join(FIXTURES, "product/api"), "prod")).toStrictEqual({
      assetsDirectory: "./assets",
      minify: true,
      uploadSourceMaps: true,
    });
    expect(await readBundlerSettings(join(FIXTURES, "product"), "prod")).toStrictEqual({});
  },
  LOAD_TIMEOUT,
);

it(
  "fails naming the file and the keys it maps for a key it cannot map",
  async () => {
    const dir = join(FIXTURES, "bad-settings");
    const failure = readBundlerSettings(dir, "prod");

    await expect(failure).rejects.toThrow(join(dir, "wrangler.config.ts"));
    await expect(readBundlerSettings(dir, "prod")).rejects.toThrow(
      "infra gen maps assetsDirectory, minify, uploadSourceMaps only",
    );
  },
  LOAD_TIMEOUT,
);

it(
  "calls a settings function with the scope as its mode",
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "cf-settings-"));

    writeFileSync(join(dir, "wrangler.config.ts"), 'export default ({ mode }) => ({ minify: mode === "prod" });\n');

    expect(await readBundlerSettings(dir, "prod")).toStrictEqual({ minify: true });
    expect(await readBundlerSettings(dir, "dev")).toStrictEqual({ minify: false });
    rmSync(dir, { force: true, recursive: true });
  },
  LOAD_TIMEOUT,
);
