import { expect, test } from "vitest";

import { fakeDeployIo } from "./__fixtures__/fake-deploy-io.ts";
import { fakeTarget } from "./__fixtures__/fake-target.ts";
import type { DeployRequest } from "./deploy-request.ts";
import { deploy } from "./deploy.ts";

const PROD: DeployRequest = { prune: false, scope: "prod", targets: [fakeTarget()] };
const NO_TOKEN = "CLOUDFLARE_API_TOKEN has no global value; run bun repo env set CLOUDFLARE_API_TOKEN --scope global";
const SECRETS = { KEPT: "kept-value" };

test("a plain Worker deploys with cf in its package dir under the product's env", async () => {
  const { calls, io, linked } = fakeDeployIo();

  expect(await deploy(PROD, io)).toBe(0);
  expect(linked).toStrictEqual(["/repo/apps/web/api"]);
  expect(calls).toHaveLength(2);
  expect(calls[0]).toStrictEqual({
    args: ["deploy", "--mode", "prod"],
    cwd: "/repo/apps/web/api",
    env: { CLOUDFLARE_API_TOKEN: "token" },
    tool: "cf",
  });
});

test("a build:prod script runs first and the deploy is prebuilt", async () => {
  const { calls, io } = fakeDeployIo({ scripts: { "build:prod": "vite build --mode prod" } });

  await deploy(PROD, io);

  expect(calls.map((call) => [call.tool, ...call.args])).toStrictEqual([
    ["bun", "run", "build:prod"],
    ["cf", "deploy", "--mode", "prod", "--prebuilt"],
    ["wrangler", "secret", "list", "--name", "web-api-prod"],
  ]);
});

test("a failed build stops the deploy before cf runs", async () => {
  const { calls, err, io } = fakeDeployIo({ onSpawn: () => 1, scripts: { "build:dev": "vite build" } });

  expect(await deploy({ ...PROD, scope: "dev" }, io)).toBe(1);
  expect(calls.map((call) => call.tool)).toStrictEqual(["bun"]);
  expect(err).toStrictEqual(["infra deploy: apps/web/api: bun run build:dev exited 1"]);
});

test("a vite build with no build script for the scope is refused before anything runs", async () => {
  const { calls, err, io } = fakeDeployIo({ scripts: { build: "vite build", "build:dev": "vite build" } });

  expect(await deploy(PROD, io)).toBe(1);
  expect(calls).toStrictEqual([]);
  expect(err).toStrictEqual([
    "infra deploy: apps/web/api: a script runs `vite build`, " +
      "so infra deploy needs a `build:prod` script to build the Worker it ships",
  ]);
});

test("a missing credential fails before any program runs", async () => {
  const { calls, err, io } = fakeDeployIo();

  const missing = {
    ...io,
    env: () => {
      throw new Error(NO_TOKEN);
    },
  };

  expect(await deploy(PROD, missing)).toBe(1);
  expect(calls).toStrictEqual([]);
  expect(err[0]).toBe(`infra deploy: apps/web/api: ${NO_TOKEN}`);
});

test("a failing Worker is reported and the next one still deploys", async () => {
  const other = { ...fakeTarget(), scriptName: "web-api-two" };
  const { calls, err, io } = fakeDeployIo({ onSpawn: (call) => (calls.length === 1 && call.tool === "cf" ? 3 : 0) });

  expect(await deploy({ ...PROD, targets: [fakeTarget(), other] }, io)).toBe(1);
  expect(err).toStrictEqual(["infra deploy: apps/web/api: cf deploy exited 3"]);
  expect(calls.filter((call) => call.tool === "cf")).toHaveLength(2);
});

test("secrets the config does not declare are named and kept without --prune", async () => {
  const { calls, io, out } = fakeDeployIo({ listed: ["ZED", "KEPT", "OLD_KEY"], secrets: SECRETS });

  expect(await deploy(PROD, io)).toBe(0);
  expect(out).toStrictEqual([
    "apps/web/api --scope prod still has secrets its cloudflare.config.ts does not declare: OLD_KEY, ZED. " +
      "Run again with --prune to delete them.",
  ]);
  expect(calls.some((call) => call.args.includes("delete"))).toBe(false);
});

test("--prune deletes each undeclared secret from the deployed script", async () => {
  const { calls, io, out } = fakeDeployIo({ listed: ["OLD_KEY", "KEPT"], secrets: SECRETS });

  await deploy({ ...PROD, prune: true }, io);

  expect(calls.at(-1)).toMatchObject({
    args: ["secret", "delete", "OLD_KEY", "--name", "web-api-prod"],
    tool: "wrangler",
  });
  expect(out).toStrictEqual(["Deleted secret OLD_KEY from apps/web/api --scope prod."]);
});

test("declared secrets alone print nothing", async () => {
  const { io, out } = fakeDeployIo({ listed: ["KEPT"], secrets: SECRETS });

  await deploy(PROD, io);

  expect(out).toStrictEqual([]);
});
