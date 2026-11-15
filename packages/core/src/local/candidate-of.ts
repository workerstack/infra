import { readFileSync } from "node:fs";
import { join } from "node:path";

import * as z from "zod";

import { CF_CONFIG_FILE, GENERATED_DIR } from "../cf-config/cf-config.constants.ts";
import type { CfConfig } from "../cf-config/cf-config.ts";
import { objectsAt } from "../cf-config/objects-at.ts";
import { stringAt } from "../cf-config/string-at.ts";
import type { CfKit } from "../cf-kit/cf-kit.ts";
import { posixRelative } from "../shared/posix-relative.ts";
import { edgeRoutesSchema } from "./edge-route.ts";
import { VITE_WORKER_PLUGIN } from "./local.constants.ts";
import { placedOnZone } from "./placed-on-zone.ts";
import { readOrUndefined } from "./read-or-undefined.ts";
import type { CandidateKind, StackCandidate } from "./stack-candidate.ts";

/** One package read: its dir, the product root, and its config for `local` and for `prod`. */
type PackageRead = { dir: string; local: CfConfig; prod: CfConfig; productRoot: string };

const PROD_SUFFIX = "-prod";

function depsOf(packageDir: string): string[] {
  const deps = z.record(z.string(), z.string()).optional();
  const manifest = z.object({ dependencies: deps, devDependencies: deps });
  const text = readOrUndefined(() => readFileSync(join(packageDir, "package.json"), "utf8")) ?? "{}";
  const parsed = manifest.parse(JSON.parse(text));

  return Object.keys({ ...parsed.dependencies, ...parsed.devDependencies });
}

function kindOf(read: PackageRead, dir: string, apps: readonly string[]): CandidateKind {
  if (apps.includes(dir)) return "app";

  if (depsOf(read.dir).includes(VITE_WORKER_PLUGIN)) return "vite";

  return (objectsAt(read.local.wrangler, "containers")?.length ?? 0) > 0 ? "container" : "worker";
}

/**
 * A Worker package as the stack sees it: its local config is what `infra gen` writes, its name and kind come from
 * its `local` read, its routes from its `prod` one.
 */
export function candidateOf(read: PackageRead, kit: CfKit, localHost: string): StackCandidate {
  const dir = posixRelative(read.productRoot, read.dir);
  const prodName = stringAt(read.prod.wrangler, "name") ?? "";
  const worker = prodName.endsWith(PROD_SUFFIX) ? prodName.slice(0, -PROD_SUFFIX.length) : prodName;
  const routes = edgeRoutesSchema().parse(read.prod.wrangler.routes ?? []);
  const source = join(read.dir, CF_CONFIG_FILE);

  return {
    config: join(read.dir, GENERATED_DIR, "wrangler.local.json"),
    dir,
    kind: kindOf(read, dir, kit.localApps),
    name: stringAt(read.local.wrangler, "name") ?? "",
    packageDir: read.dir,
    routes: placedOnZone(routes, { localHost, source, worker, zone: kit.zoneDomain }),
    worker,
  };
}
