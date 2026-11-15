import { expect, it } from "vitest";

import { cloudflareConfig } from "../runner/__fixtures__/cloudflare-config.ts";
import { fakeRedirect, fakeSetDeps } from "./__fixtures__/set-deps.ts";
import { product, testHost } from "./__fixtures__/test-host.ts";
import { runSet } from "./run-set.ts";

const FILE = "/repo/apps/web/infra.config.ts";
const CONFIG = 'kv: { id: "STUB" }, microsoft: { clientId: "STUB" }';

const results = {
  access: { key: "ACCESS_SERVICE_TOKEN_CLIENT_SECRET", scope: "prod" as const, value: "access-secret-value" },
  microsoft: { key: "MICROSOFT_CLIENT_SECRET", scope: "prod" as const, value: "ms-secret-value" },
  turnstile: { key: "TURNSTILE_SECRET_KEY", scope: "prod" as const, value: "turnstile-secret-value" },
};

const web = product("apps/web", {
  cloudflare: cloudflareConfig({ access: {} }),
  github: { oauth: {} },
  microsoft: { oauth: {} },
});

it("set runs the runners in the old order, writes ids once, then sends every secret to writeSecrets", async () => {
  const { deps, trace } = fakeSetDeps({ [FILE]: CONFIG }, results);

  expect(await runSet([], testHost([web]).host, deps)).toBe(0);
  expect(trace.calls).toStrictEqual([
    "bindings",
    "access",
    "ai-search",
    "redirects",
    "zone",
    "microsoft",
    "github",
    "write-config",
    "write-secrets",
  ]);
  expect(trace.files.get(FILE)).toBe('kv: { id: "kv1" }, microsoft: { clientId: "app1" }');
  expect(trace.secrets).toStrictEqual([results.turnstile, results.access, results.microsoft]);
});

it("set applies the zone with the redirect list zoneRedirects builds from the product root", async () => {
  const { deps, trace } = fakeSetDeps({ [FILE]: CONFIG }, results);

  expect(await runSet([], testHost([web]).host, deps)).toBe(0);
  expect(trace.redirects).toStrictEqual([[fakeRedirect("/repo/apps/web")]]);
});

it("no secret value appears in the written config text", async () => {
  const { deps, trace } = fakeSetDeps({ [FILE]: CONFIG }, results);

  await runSet([], testHost([web]).host, deps);

  const text = trace.files.get(FILE) ?? "";

  for (const secret of trace.secrets) expect(text).not.toContain(secret.value);
});

it("a failing step still writes what was provisioned, then the product fails", async () => {
  const { deps, trace } = fakeSetDeps({ [FILE]: CONFIG }, results);
  const failing = { ...deps, applyMicrosoft: () => Promise.reject(new Error("graph down")) };
  const { err, host } = testHost([web]);

  expect(await runSet([], host, failing)).toBe(1);
  expect(trace.secrets).toStrictEqual([results.turnstile, results.access]);
  expect(err).toStrictEqual(["infra set: apps/web: graph down"]);
});

it("set with nothing provisioned writes no file and no secrets", async () => {
  const { deps, trace } = fakeSetDeps({}, results);
  const bare = product("apps/web");

  expect(await runSet([], testHost([bare]).host, deps)).toBe(0);
  expect(trace.calls).toStrictEqual([]);
});

it("set applies IndexNow and Yandex after GitHub, with the given host and the zone domain", async () => {
  const { deps, trace } = fakeSetDeps({ [FILE]: CONFIG }, results);

  const site = product("apps/web", {
    cloudflare: cloudflareConfig(),
    github: { oauth: {} },
    indexNow: { host: "www.example.com", key: "abcd1234-key", sitemapUrls: [] },
    yandex: { webmaster: { sitemapUrls: [] } },
  });

  expect(await runSet([], testHost([site]).host, deps)).toBe(0);
  expect(trace.calls.slice(-5, -2)).toStrictEqual(["github", "indexnow www.example.com", "yandex https://example.com"]);
});
