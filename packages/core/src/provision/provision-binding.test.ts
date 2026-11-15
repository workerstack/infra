import { describe, expect, it } from "vitest";

import { logLines } from "./__fixtures__/log-lines.ts";
import { routedClient } from "./__fixtures__/routed-client.ts";
import { provisionD1 } from "./provision-d1.ts";
import { provisionKv } from "./provision-kv.ts";
import { provisionR2 } from "./provision-r2.ts";

const A = "/accounts/acc";

function context() {
  const { lines, log } = logLines();

  return { ctx: { accountId: "acc", env: "prod", log, zoneId: "z" }, lines };
}

describe("provisionD1", () => {
  it("anchors the id edit on the database name, so another STUB is left alone", async () => {
    const { ctx } = context();

    const routes = {
      [`GET ${A}/d1/database`]: [{ name: "example.db", uuid: "u9" }],
      [`GET ${A}/d1/database/u9`]: { read_replication: { mode: "auto" } },
    };

    const { client } = routedClient(routes);

    const [edit] = await provisionD1(client, ctx, { database_id: "STUB", database_name: "example.db" });
    const text = 'database_id: "STUB",\n  database_name: "other"\ndatabase_id: "STUB",\n  database_name: "example.db"';

    expect(text.replace(edit?.pattern ?? "", edit?.replacement ?? "")).toBe(
      'database_id: "STUB",\n  database_name: "other"\ndatabase_id: "u9",\n  database_name: "example.db"',
    );
  });

  it("does nothing for a database with no name", async () => {
    const { calls, client } = routedClient({});

    expect(await provisionD1(client, context().ctx, {})).toStrictEqual([]);
    expect(calls).toStrictEqual([]);
  });
});

describe("provisionKv", () => {
  it("titles the namespace from its key and the env, and edits only its own id", async () => {
    const { ctx, lines } = context();
    const created = { id: "kv9", title: "example-cache-kv-prod" };
    const { client } = routedClient({ [`GET ${A}/storage/kv/namespaces`]: [created] });

    const edits = await provisionKv(client, ctx, { key: "EXAMPLE_CACHE_KV", value: { id: "STUB" } });

    expect(lines[0]).toBe('  [prod] KV "example-cache-kv-prod" ...');
    expect(edits).toStrictEqual([
      { pattern: 'EXAMPLE_CACHE_KV: { id: "STUB" }', replacement: 'EXAMPLE_CACHE_KV: { id: "kv9" }' },
    ]);
  });
});

describe("provisionR2", () => {
  const buckets = `${A}/r2/buckets`;

  it("makes the bucket and logs each CORS rule count", async () => {
    const { ctx, lines } = context();

    const { calls, client } = routedClient({
      [`GET ${buckets}`]: { buckets: [{ name: "b" }] },
      [`PUT ${buckets}/b/cors`]: {},
    });

    const rule = { allowed: { methods: ["GET" as const], origins: ["https://example.com"] } };

    await provisionR2(client, ctx, { bucket_name: "b", cors: [rule, rule] });

    expect(lines).toContain("    CORS (2 rules) ...");
    expect(calls.map((call) => call.method)).toStrictEqual(["GET", "PUT"]);
  });

  it("does nothing for a bucket with no name", async () => {
    const { calls, client } = routedClient({});

    await provisionR2(client, context().ctx, {});

    expect(calls).toStrictEqual([]);
  });
});
