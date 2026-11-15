import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import * as z from "zod";

import type { InfraScope } from "../schema/infra.ts";
import type { BundlerSettings } from "./bundler-settings.ts";
import { WRANGLER_CONFIG_FILE } from "./cf-config.constants.ts";

// A settings module's default export: the settings, a promise of them, or a function of the context.
type SettingsModule = { default?: object };

// Any other key fails, so a setting is never dropped without a word.
function bundlerSettingsSchema(): z.ZodType<BundlerSettings> {
  return z.strictObject({
    assetsDirectory: z.string().optional(),
    minify: z.boolean().optional(),
    uploadSourceMaps: z.boolean().optional(),
  });
}

// The settings a module exports for `scope`: called with Wrangler's context when the export is a function.
async function exportedSettings(file: string, scope: InfraScope): Promise<BundlerSettings> {
  const loaded = await (import(pathToFileURL(file).href) /* a wrangler.config.ts module */ as Promise<SettingsModule>);

  if (loaded.default === undefined) throw new Error(`${file}: does not have a default export`);

  const context = z.object({ isPreview: z.boolean(), mode: z.string() });
  const called = z.function({ input: [context], output: z.unknown() }).safeParse(loaded.default);

  const settings = await Promise.resolve(
    called.success ? called.data({ isPreview: false, mode: scope }) : loaded.default,
  );

  const parsed = bundlerSettingsSchema().safeParse(settings);

  if (parsed.success) return parsed.data;

  throw new Error(
    `${file}: ${z.prettifyError(parsed.error)}\ninfra gen maps assetsDirectory, minify, uploadSourceMaps only`,
  );
}

/** A Worker package's `wrangler.config.ts` for `scope`; `{}` when the package has none. */
export function readBundlerSettings(dir: string, scope: InfraScope): Promise<BundlerSettings> {
  const file = join(dir, WRANGLER_CONFIG_FILE);

  return existsSync(file) ? exportedSettings(file, scope) : Promise.resolve({});
}
