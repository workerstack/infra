import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { Product } from "../../products.ts";
import type { InfraEnv } from "../../schema/infra.ts";
import { fakeInfraEnv } from "../../shared/__fixtures__/fake-infra-env.ts";
import type { WorkerCatalog } from "../../workers/worker-catalog.ts";
import type { WorkerRecord } from "../../workers/worker-record.ts";
import type { LogsHost } from "../logs-host.ts";

export const ACCOUNT_ENV: InfraEnv = fakeInfraEnv({
  global: { CLOUDFLARE_ACCOUNT_EMAIL: "me@example.test", CLOUDFLARE_ACCOUNT_ID: "acct-1", CLOUDFLARE_API_KEY: "key-1" },
});

export type FakeLogs = {
  err: string[];
  host: LogsHost;
  out: string[];
  root: string;
  /** Fires every stop callback the command registered. */
  interrupt: () => void;
};

const roots: string[] = [];

/** Removes the temp roots `fakeLogs` made. */
export function cleanRoots(): void {
  for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true });
}

function workerAt(product: Product, dir: string, base: string): WorkerRecord {
  return {
    baseName: base,
    dir,
    packageDir: join(product.root, dir),
    product,
    scopes: { dev: { scriptName: `${base}-dev` }, prod: { scriptName: `${base}-prod` } },
  };
}

/** A host over a temp root holding two Workers (`web-api` and `docs-site`) of products with `envs`. */
export function fakeLogs(envs: { docs?: InfraEnv; web?: InfraEnv } = {}): FakeLogs {
  const root = mkdtempSync(join(tmpdir(), "infra-logs-"));
  const web: Product = { config: { env: envs.web ?? ACCOUNT_ENV }, configFile: "", name: "apps/web", root };
  const docs: Product = { config: { env: envs.docs ?? ACCOUNT_ENV }, configFile: "", name: "apps/docs", root };
  const catalog: WorkerCatalog = {
    root,
    workers: [workerAt(docs, "apps/docs/worker", "docs-site"), workerAt(web, "apps/web/api", "web-api")],
  };
  const stops: (() => void)[] = [];
  const out: string[] = [];
  const err: string[] = [];

  roots.push(root);

  return {
    err,
    host: {
      cwd: root,
      guard: () => undefined,
      load: () => Promise.resolve(catalog),
      onStop: (stop) => {
        stops.push(stop);

        return () => undefined;
      },
      root: () => root,
      stderr: (line) => err.push(line),
      stdout: (line) => out.push(line),
    },
    interrupt: () => {
      for (const stop of stops) stop();
    },
    out,
    root,
  };
}
