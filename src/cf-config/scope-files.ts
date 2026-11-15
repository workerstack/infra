import { existsSync } from "node:fs";
import { join } from "node:path";

import { VITE_DEV_MODE } from "../cf-kit/cf-kit.constants.ts";
import type { InfraScope } from "../schema/infra.ts";
import { stringifyJson } from "../shared/jsonc.ts";
import { LOCAL_SCOPE } from "../shared/local-scope.constants.ts";
import { GENERATED_DIR, VITE_CONFIG_FILE } from "./cf-config.constants.ts";
import { devVarsPathOf } from "./dev-vars-path-of.ts";
import type { JsonObject } from "./json-object.ts";
import { objectAt } from "./object-at.ts";
import type { PackageInput } from "./package-input.ts";
import type { PlannedFile } from "./planned-file.ts";
import { renderDevVars } from "./render-dev-vars.ts";
import { stringsAt } from "./strings-at.ts";

// The local stack's URL vars the config declares; they hold the running stack's origin.
function urlVars(input: PackageInput, scope: InfraScope, wrangler: JsonObject): Record<string, string> {
  if (scope !== LOCAL_SCOPE) return {};

  const declared = objectAt(wrangler, "vars") ?? {};

  return Object.fromEntries(Object.entries(input.kit.localUrlVars(input.origin)).filter(([key]) => key in declared));
}

// `wrangler dev` of the local stack reads `.dev.vars` beside the config it runs, in `.cloudflare/`; a Vite app
// runs `local` under Vite's dev mode, and Cloudflare's plugin reads `.dev.vars.<mode>`.
function devVarsTargets(dir: string, scope: InfraScope): string[] {
  if (scope !== LOCAL_SCOPE) return [devVarsPathOf(dir, scope)];

  const vite = existsSync(join(dir, VITE_CONFIG_FILE)) ? [devVarsPathOf(dir, VITE_DEV_MODE)] : [];

  return [devVarsPathOf(dir, scope), join(dir, GENERATED_DIR, ".dev.vars"), ...vite];
}

/** The files one scope of a package gets: its Wrangler config and its `.dev.vars` of declared secrets. */
export function scopeFiles(input: PackageInput, scope: InfraScope, wrangler: JsonObject): PlannedFile[] {
  const values = {
    ...urlVars(input, scope, wrangler),
    ...input.kit.secretValues(scope, stringsAt(objectAt(wrangler, "secrets"), "required")),
  };

  const text = renderDevVars(values, input.shown);
  const config = { file: join(input.dir, GENERATED_DIR, `wrangler.${scope}.json`), text: stringifyJson(wrangler) };

  return [config, ...devVarsTargets(input.dir, scope).map((file) => ({ file, text }))];
}
