import { afterAll, beforeAll, expect, it } from "vitest";

import { cleanCopies } from "../cf-config/__fixtures__/copy-product.ts";
import { copyRoot } from "./__fixtures__/copy-root.ts";
import { loadWorkers } from "./load-workers.ts";
import { resolveWorkers } from "./resolve-workers.ts";
import type { WorkerCatalog } from "./worker-catalog.ts";

const LOAD_TIMEOUT = 60_000;
let catalog: WorkerCatalog;

beforeAll(async () => {
  catalog = await loadWorkers(copyRoot());
}, LOAD_TIMEOUT);

afterAll(cleanCopies);

function scripts(selectors: string[], scope: "dev" | "prod" = "prod"): string[] | string {
  const result = resolveWorkers(catalog, selectors, scope);

  return result.ok ? result.targets.map((target) => target.scriptName) : result.error;
}

it("picks a Worker by product name, package dir, base name or script name", () => {
  expect(scripts(["apps/web"])).toStrictEqual(["web-api-prod"]);
  expect(scripts(["apps/docs/worker"])).toStrictEqual(["docs-site-prod"]);
  expect(scripts(["web-api"])).toStrictEqual(["web-api-prod"]);
  expect(scripts(["docs-site-dev"], "dev")).toStrictEqual(["docs-site-dev"]);
});

it("takes a package dir from the root, however it is written", () => {
  expect(scripts(["./apps/web/../web/api/"])).toStrictEqual(["web-api-prod"]);
});

it("picks each Worker once, in the order selected", () => {
  expect(scripts(["web-api", "apps/web", "docs-site"])).toStrictEqual(["web-api-prod", "docs-site-prod"]);
});

it("names the catalog for a selector that matches nothing", () => {
  expect(scripts(["web-api", "nope"])).toBe(
    'No worker matches "nope". Known:\n  docs-site (apps/docs/worker)\n  web-api (apps/web/api)',
  );
});

it("carries the observability its config sets for the scope", () => {
  const result = resolveWorkers(catalog, ["docs-site"], "dev");

  expect(result.ok && result.targets[0]?.observability).toMatchObject({ enabled: true });
});

it("refuses a product whose Workers never deploy to the scope", () => {
  const [worker] = catalog.workers;

  const lacking = {
    ...catalog,
    workers: worker === undefined ? [] : [{ ...worker, scopes: { prod: worker.scopes.prod } }],
  };

  expect(resolveWorkers(lacking, ["docs-site"], "dev")).toStrictEqual({
    error: '"docs-site" names only Workers that never deploy to dev',
    ok: false,
  });
});
