import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { resolveAndParseConfig } from "@cloudflare/config";
import { defineConfig } from "cf/config";
import { afterAll, expect, it } from "vitest";

import short from "../../test/__fixtures__/product/api/cloudflare.config.ts";
import infra from "../../test/__fixtures__/product/infra.config.ts";
import { PRODUCT_ROOT } from "./cf-kit.constants.ts";

const LIMIT = 5;
const PERIOD = 60;
const root = mkdtempSync(join(tmpdir(), "cf-worker-"));
const ids = { "web-api": { dev: { LIMIT_5: 2 }, local: { LIMIT_5: 1 }, prod: { LIMIT_5: 3 } } };

writeFileSync(join(root, "ratelimit-ids.json"), JSON.stringify(ids));

infra[PRODUCT_ROOT](root);

afterAll(() => {
  rmSync(root, { force: true, recursive: true });
});

// The fixture's api Worker as it was written before `infra.worker`: every part by hand.
const long = defineConfig(({ mode }) => {
  const scope = infra.scope(mode);

  return {
    worker: {
      ...infra.defaults,
      compatibilityDate: "2026-01-20",
      entrypoint: "./src/index.ts",
      env: {
        ...infra.d1(scope, "DB"),
        ...infra.ratelimits("web-api", scope, { name: "LIMIT_5", simple: { limit: LIMIT, period: PERIOD } }),
        ...infra.secrets((e) => [e.API_KEY]),
        ...infra.vars(scope, (e) => [e.GREETING, e.SITE_URL]),
      },
      name: infra.name("web-api", scope),
      triggers: infra.routes(["example.com/api/*"], "example.com"),
    },
  };
});

async function parsed(config: Parameters<typeof resolveAndParseConfig>[0], mode: string) {
  const result = await resolveAndParseConfig(config, { isPreview: false, mode });

  if (!result.success) throw new Error(result.error.message);

  return result.data;
}

it.each(infra.envs)("gives the config the long form gives in %s", async (scope) => {
  expect(await parsed(short, scope)).toStrictEqual(await parsed(long, scope));
});

// The same Worker written with picks by property, whatever the fixture file holds.
const picked = infra.worker("web-api", {
  compatibilityDate: "2026-01-20",
  d1: ["DB"],
  entrypoint: "./src/index.ts",
  ratelimits: [{ name: "LIMIT_5", simple: { limit: LIMIT, period: PERIOD } }],
  routes: ["example.com/api/*"],
  secrets: (e) => [e.API_KEY],
  vars: (e) => [e.GREETING, e.SITE_URL],
});

it.each(infra.envs)("gives the long form's config from picks in %s", async (scope) => {
  expect(await parsed(picked, scope)).toStrictEqual(await parsed(long, scope));
});

it("merges extra last: its env beside the shorthand's, its triggers after the routes", () => {
  const config = infra.worker("web-api", {
    compatibilityDate: "2026-01-20",
    entrypoint: "./src/index.ts",
    extra: (scope) => ({ env: { ...infra.vars(scope, (e) => [e.SITE_URL]) }, observability: { enabled: true } }),
    routes: ["example.com/x/*"],
    vars: (e) => [e.GREETING],
    zone: "other.com",
  });

  const { worker } = config({ mode: "dev" });

  expect(defineConfig(config)).toBe(config);

  expect(Object.keys(worker.env ?? {}).toSorted()).toStrictEqual(["ENVIRONMENT", "GREETING", "SITE_URL"]);
  expect(worker.triggers).toStrictEqual(infra.routes(["example.com/x/*"], "other.com"));
  expect(worker.observability).toStrictEqual({ enabled: true });
  expect(worker.name).toBe("web-api-dev");
});
