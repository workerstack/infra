import { rmSync } from "node:fs";
import { join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { cleanCopies } from "../cf-config/__fixtures__/copy-product.ts";
import { copyRoot } from "./__fixtures__/copy-root.ts";
import { loadWorkers } from "./load-workers.ts";

const LOAD_TIMEOUT = 60_000;

afterEach(cleanCopies);

it(
  "lists the Workers of every product by package dir, with names and observability per scope",
  async () => {
    const root = copyRoot();
    const { workers } = await loadWorkers(root);

    expect(workers.map((worker) => [worker.product.name, worker.dir, worker.baseName])).toStrictEqual([
      ["apps/docs", "apps/docs/worker", "docs-site"],
      ["apps/web", "apps/web/api", "web-api"],
    ]);

    const scripts = workers.map((worker) => [worker.scopes.dev?.scriptName, worker.scopes.prod?.scriptName]);

    expect(scripts).toStrictEqual([
      ["docs-site-dev", "docs-site-prod"],
      ["web-api-dev", "web-api-prod"],
    ]);
    expect(workers.map((worker) => worker.scopes.prod?.observability)).toMatchObject([{ enabled: true }, undefined]);
    expect(workers[0]?.packageDir).toBe(join(root, "apps/docs/worker"));
  },
  LOAD_TIMEOUT,
);

it(
  "leaves out a product that has no Worker package",
  async () => {
    const root = copyRoot();
    rmSync(join(root, "apps/docs/worker"), { force: true, recursive: true });

    const { workers } = await loadWorkers(root);

    expect(workers.map((worker) => worker.dir)).toStrictEqual(["apps/web/api"]);
  },
  LOAD_TIMEOUT,
);
