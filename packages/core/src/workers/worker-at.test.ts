import { join } from "node:path";

import { afterAll, beforeAll, expect, it } from "vitest";

import { cleanCopies } from "../cf-config/__fixtures__/copy-product.ts";
import { copyRoot } from "./__fixtures__/copy-root.ts";
import { loadWorkers } from "./load-workers.ts";
import { workerAt } from "./worker-at.ts";
import type { WorkerCatalog } from "./worker-catalog.ts";

const LOAD_TIMEOUT = 60_000;
let catalog: WorkerCatalog;

beforeAll(async () => {
  catalog = await loadWorkers(copyRoot());
}, LOAD_TIMEOUT);

afterAll(cleanCopies);

it("picks the Worker whose package holds the dir, from a subdirectory too", () => {
  for (const dir of ["apps/web/api", join(catalog.root, "apps/web/api/src")]) {
    const result = workerAt(catalog, dir, "prod");

    expect(result.ok && result.targets.map((target) => target.scriptName)).toStrictEqual(["web-api-prod"]);
  }
});

it("asks for a name where no Worker package holds the dir", () => {
  for (const dir of [".", "apps/web", "apps/web/db"]) {
    expect(workerAt(catalog, dir, "dev")).toStrictEqual({
      error: "no Worker package holds the current dir; name a Worker",
      ok: false,
    });
  }
});
