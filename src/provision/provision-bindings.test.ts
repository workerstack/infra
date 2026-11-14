import { describe, expect, it } from "vitest";

import { fakeEnv } from "../access/__fixtures__/fake-env.ts";
import type { EnvBindings } from "../schema/bindings.ts";
import { logLines } from "./__fixtures__/log-lines.ts";
import { routedClient } from "./__fixtures__/routed-client.ts";
import { applyEdits } from "./apply-edits.ts";
import { provisionBindings } from "./provision-bindings.ts";
import { provisionEnvBindings } from "./provision-env-bindings.ts";
import { provisionTurnstile } from "./provision-turnstile.ts";

const A = "/accounts/acc";

const CONFIG = [
  'd1: { database_id: "STUB",',
  '  database_name: "example-db-dev" },',
  'kv: { EXAMPLE_CACHE_KV: { id: "STUB" } },',
].join("\n");

const BINDINGS: EnvBindings = {
  analytics_engine_datasets: { EVENTS: { dataset: "example-events" } },
  d1_databases: { DB: { database_id: "STUB", database_name: "example-db-dev" } },
  kv_namespaces: { EXAMPLE_CACHE_KV: { id: "STUB" } },
  queues: { JOBS: { queue: "example-jobs-dev" } },
  r2_buckets: {
    FILES: {
      bucket_name: "example-files-dev",
      cors: [{ allowed: { methods: ["GET"], origins: ["https://example.com"] } }],
      customDomains: ["cdn.example.com"],
    },
  },
};

const ROUTES = {
  [`GET ${A}/d1/database`]: [],
  [`GET ${A}/d1/database/u1`]: { name: "n", num_tables: 0, read_replication: { mode: "disabled" }, uuid: "u1" },
  [`GET ${A}/queues`]: [{ queue_id: "q", queue_name: "example-jobs-dev" }],
  [`GET ${A}/r2/buckets`]: { buckets: [] },
  [`GET ${A}/storage/kv/namespaces`]: [],
  [`PATCH ${A}/d1/database/u1`]: {},
  [`POST ${A}/d1/database`]: { name: "example-db-dev", uuid: "u1" },
  [`POST ${A}/r2/buckets`]: {},
  [`POST ${A}/r2/buckets/example-files-dev/domains/custom`]: {},
  [`POST ${A}/storage/kv/namespaces`]: { id: "kv1", title: "example-cache-kv-dev" },
  [`PUT ${A}/r2/buckets/example-files-dev/cors`]: {},
};

const TARGET = { accountId: "acc", env: fakeEnv("dev"), zoneId: "z" };

describe("provisionBindings", () => {
  it("creates each resource and returns edits for the D1 and KV ids that rewrite the config", async () => {
    const { client } = routedClient(ROUTES);

    const { edits, secrets } = await provisionBindings(client, { ...TARGET, bindings: { dev: BINDINGS } }, () => {
      // not under test
    });

    expect(secrets).toStrictEqual([]);
    expect(applyEdits(CONFIG, edits)).toBe(
      [
        'd1: { database_id: "u1",',
        '  database_name: "example-db-dev" },',
        'kv: { EXAMPLE_CACHE_KV: { id: "kv1" } },',
      ].join("\n"),
    );
  });

  it("logs a line per resource tagged with its env", async () => {
    const { client } = routedClient(ROUTES);
    const { lines, log } = logLines();

    await provisionBindings(client, { ...TARGET, bindings: { dev: BINDINGS } }, log);

    expect(lines).toContain('  [dev] D1 "example-db-dev" ...');
    expect(lines).toContain('  [dev] KV "example-cache-kv-dev" ...');
    expect(lines).toContain('  [dev] R2 "example-files-dev" ...');
    expect(lines).toContain("    CORS (1 rule) ...");
    expect(lines).toContain("    → attached");
    expect(lines).toContain('  [dev] Queue "example-jobs-dev" ...');
    expect(lines).toContain('  [dev] AE "example-events" ... (auto-created on first write)');
    expect(lines).toContain("    read replicas: enabling ...");
  });
});

describe("provisionBindings with what exists", () => {
  it("makes no edit for an id that is already real, and leaves replicas alone when they are on", async () => {
    const real: EnvBindings = {
      d1_databases: { DB: { database_id: "real", database_name: "example-db-dev" } },
      kv_namespaces: { EXAMPLE_CACHE_KV: { id: "real" } },
    };

    const routes = {
      ...ROUTES,
      [`GET ${A}/d1/database`]: [{ name: "example-db-dev", uuid: "u1" }],
      [`GET ${A}/d1/database/u1`]: { read_replication: { mode: "auto" } },
      [`GET ${A}/storage/kv/namespaces`]: [{ id: "kv1", title: "example-cache-kv-dev" }],
    };

    const { calls, client } = routedClient(routes);
    const { lines, log } = logLines();
    const { edits } = await provisionBindings(client, { ...TARGET, bindings: { dev: real } }, log);

    expect(edits).toStrictEqual([]);
    expect(calls.filter((call) => call.method !== "GET")).toStrictEqual([]);
    expect(lines).toContain("    read replicas: auto");
  });

  it("logs a failed replica switch and carries on", async () => {
    const { client } = routedClient({ ...ROUTES, [`PATCH ${A}/d1/database/u1`]: new Error("no replicas") });
    const { lines, log } = logLines();
    const ctx = { accountId: "acc", env: "dev", log, zoneId: "z" };

    const edits = await provisionEnvBindings(client, ctx, { d1_databases: BINDINGS.d1_databases ?? {} });

    expect(lines).toContain("    → failed: no replicas");
    expect(edits).toHaveLength(1);
  });
});

describe("provisionBindings with nameless resources", () => {
  it("skips a D1 database with no name and a widget with no name", async () => {
    const { calls, client } = routedClient({});
    const nameless: EnvBindings = { d1_databases: { DB: {} }, queues: { Q: {} } };
    const turnstile = { prod: { domains: [], mode: "managed" as const, name: "", siteKey: "STUB" } };

    await provisionBindings(client, { ...TARGET, bindings: { dev: nameless }, turnstile });

    expect(calls).toStrictEqual([]);
  });
});

describe("provisionTurnstile", () => {
  it("makes no secret write when the scope already holds one", async () => {
    const widgets = `${A}/challenges/widgets`;
    const { client } = routedClient({ [`GET ${widgets}`]: [], [`POST ${widgets}`]: { secret: "s", sitekey: "k" } });
    const config = { domains: ["example.com"], mode: "managed" as const, name: "w", siteKey: "real" };
    const env = fakeEnv("prod", { TURNSTILE_SECRET_KEY: "kept" });

    const result = await provisionTurnstile(client, { accountId: "acc", config, env, scope: "prod" }, () => {});

    expect(result).toStrictEqual({ edits: [], secrets: [] });
  });
});
