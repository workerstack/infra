import { expect, it } from "vitest";

import { fixtureConfig } from "../cf-kit/__fixtures__/kit-fixtures.ts";
import { createCfKit } from "../cf-kit/create-cf-kit.ts";
import { wranglerFor } from "./wrangler-for.ts";

const kit = createCfKit({
  config: fixtureConfig(),
  migrations: { MAIN_DB: { dir: "/repo/db/migrations", owner: "api" } },
  ratelimitIds: "/repo/ids.json",
});

const DIR = "/repo/apps/api";

it("writes a container's Dockerfile path absolute, and leaves a registry image alone", () => {
  const out = wranglerFor({
    dir: DIR,
    kit,
    scope: "local",
    settings: {},
    wrangler: {
      containers: [
        { image: "../../containers/Dockerfile", name: "box" },
        { image: "registry.example.com/box", name: "r" },
      ],
      name: "api-local",
    },
  });

  expect(out["containers"]).toStrictEqual([
    { image: "/repo/containers/Dockerfile", name: "box" },
    { image: "registry.example.com/box", name: "r" },
  ]);
});

it("writes main and assets absolute, the bundler keys, and the migrations dir of the owning Worker", () => {
  const out = wranglerFor({
    dir: DIR,
    kit,
    scope: "prod",
    settings: { assetsDirectory: "./assets", minify: true, uploadSourceMaps: false },
    wrangler: {
      d1_databases: [{ binding: "MAIN_DB" }, { binding: "OTHER" }],
      main: "./src/index.ts",
      name: "api-prod",
    },
  });

  expect(out).toStrictEqual({
    assets: { directory: "/repo/apps/api/assets" },
    d1_databases: [{ binding: "MAIN_DB", migrations_dir: "/repo/db/migrations" }, { binding: "OTHER" }],
    main: "/repo/apps/api/src/index.ts",
    minify: true,
    name: "api-prod",
    upload_source_maps: false,
  });
});

it("writes only the migrations dir of a binding whose migrations name a database", () => {
  const named = createCfKit({
    config: fixtureConfig(),
    migrations: { MAIN_DB: { database: "main", dir: "/repo/db/migrations", owner: "api" } },
    ratelimitIds: "/repo/ids.json",
  });

  const out = wranglerFor({
    dir: DIR,
    kit: named,
    scope: "prod",
    settings: {},
    wrangler: { d1_databases: [{ binding: "MAIN_DB" }], name: "api-prod" },
  });

  expect(out["d1_databases"]).toStrictEqual([{ binding: "MAIN_DB", migrations_dir: "/repo/db/migrations" }]);
});
