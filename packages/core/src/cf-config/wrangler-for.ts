import { resolve } from "node:path";

import type { CfKit } from "../cf-kit/cf-kit.ts";
import type { InfraScope } from "../schema/infra.ts";
import type { BundlerSettings } from "./bundler-settings.ts";
import type { JsonObject } from "./json-object.ts";
import { objectAt } from "./object-at.ts";
import { objectsAt } from "./objects-at.ts";
import { stringAt } from "./string-at.ts";

type WranglerInput = { dir: string; kit: CfKit; scope: InfraScope; settings: BundlerSettings; wrangler: JsonObject };

// A container image is a Dockerfile path or a registry reference; only a path starts at the package.
function containerOf(dir: string, container: JsonObject): JsonObject {
  const image = stringAt(container, "image");

  return image?.startsWith(".") === true ? { ...container, image: resolve(dir, image) } : container;
}

function databaseOf(input: WranglerInput, db: JsonObject): JsonObject {
  const worker = stringAt(input.wrangler, "name") ?? "";
  const migrations = input.kit.migrationsDir(input.scope, worker, stringAt(db, "binding") ?? "");

  return migrations === undefined ? db : { ...db, migrations_dir: migrations };
}

function bundlerKeys(dir: string, wrangler: JsonObject, settings: BundlerSettings): JsonObject {
  const assets = objectAt(wrangler, "assets") ?? {};

  return {
    ...(settings.assetsDirectory !== undefined && {
      assets: { ...assets, directory: resolve(dir, settings.assetsDirectory) },
    }),
    minify: settings.minify ?? true,
    ...(settings.uploadSourceMaps !== undefined && { upload_source_maps: settings.uploadSourceMaps }),
  };
}

/**
 * The Wrangler config `infra gen` writes to `.cloudflare/`. Wrangler resolves a path in a config against the
 * config's directory, so the paths the package owns are written absolute; the bundler settings and each D1
 * binding's migrations dir are added.
 */
export function wranglerFor(input: WranglerInput): JsonObject {
  const { dir, wrangler } = input;
  const main = stringAt(wrangler, "main");
  const containers = objectsAt(wrangler, "containers");
  const databases = objectsAt(wrangler, "d1_databases");

  return {
    ...wrangler,
    ...(main !== undefined && { main: resolve(dir, main) }),
    ...(containers !== undefined && { containers: containers.map((container) => containerOf(dir, container)) }),
    ...bundlerKeys(dir, wrangler, input.settings),
    ...(databases !== undefined && { d1_databases: databases.map((db) => databaseOf(input, db)) }),
  };
}
