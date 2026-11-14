import { describe, expect, it } from "vitest";

import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { routedClient } from "./__fixtures__/routed-client.ts";
import { enableD1ReadReplicas, getD1Detail } from "./d1-read-replicas.ts";
import { ensureR2CustomDomain } from "./ensure-r2-custom-domain.ts";
import { findOrCreateD1 } from "./find-or-create-d1.ts";
import { findOrCreateKV } from "./find-or-create-kv.ts";
import { findOrCreateQueue } from "./find-or-create-queue.ts";
import { findOrCreateTurnstile } from "./find-or-create-turnstile.ts";
import { findOrCreateR2, setR2Cors } from "./r2-bucket.ts";

const ACC = "acc";

function failing(message: string): ReturnType<typeof fakeClient> {
  return fakeClient(() => {
    throw new Error(message);
  });
}

describe("findOrCreateD1", () => {
  it("returns the database with the name and creates none", async () => {
    const { calls, client } = routedClient({ "GET /accounts/acc/d1/database": [{ name: "db", uuid: "u1" }] });

    expect(await findOrCreateD1(client, ACC, "db")).toStrictEqual({ name: "db", uuid: "u1" });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.path).toBe("/accounts/acc/d1/database?name=db&per_page=10");
  });

  it("creates a missing database", async () => {
    const { calls, client } = routedClient({
      "GET /accounts/acc/d1/database": [],
      "POST /accounts/acc/d1/database": { name: "db", uuid: "u2" },
    });

    const created = await findOrCreateD1(client, ACC, "db");

    expect(created.uuid).toBe("u2");
    expect(calls[1]?.body).toStrictEqual({ name: "db" });
  });
});

describe("findOrCreateKV and findOrCreateQueue", () => {
  const kv = "GET /accounts/acc/storage/kv/namespaces";
  const queues = "GET /accounts/acc/queues";

  it("finds a KV namespace by title and creates a missing one", async () => {
    const found = routedClient({ [kv]: [{ id: "k1", title: "t" }] });
    const created = routedClient({ "POST /accounts/acc/storage/kv/namespaces": { id: "k2", title: "t" }, [kv]: [] });
    const foundNamespace = await findOrCreateKV(found.client, ACC, "t");
    const createdNamespace = await findOrCreateKV(created.client, ACC, "t");

    expect([foundNamespace.id, createdNamespace.id]).toStrictEqual(["k1", "k2"]);
    expect(created.calls[1]?.body).toStrictEqual({ title: "t" });
  });

  it("finds a queue by name and creates a missing one", async () => {
    const found = routedClient({ [queues]: [{ queue_id: "q1", queue_name: "q" }] });
    const created = routedClient({ "POST /accounts/acc/queues": { queue_id: "q2" }, [queues]: [] });
    const foundQueue = await findOrCreateQueue(found.client, ACC, "q");

    expect(foundQueue.queue_id).toBe("q1");
    expect(await findOrCreateQueue(created.client, ACC, "q")).toStrictEqual({ queue_id: "q2" });
    expect(created.calls[1]?.body).toStrictEqual({ queue_name: "q" });
  });
});

describe("findOrCreateR2", () => {
  const buckets = "/accounts/acc/r2/buckets";
  const absent = { [`GET ${buckets}`]: { buckets: [] }, [`POST ${buckets}`]: {} };

  it("keeps an existing bucket", async () => {
    const { calls, client } = routedClient({ [`GET ${buckets}`]: { buckets: [{ name: "b" }] } });

    expect(await findOrCreateR2(client, ACC, { name: "b" })).toStrictEqual({ name: "b" });
    expect(calls).toHaveLength(1);
  });

  it("creates a missing bucket with its location hint when given", async () => {
    const { calls, client } = routedClient(absent);

    await findOrCreateR2(client, ACC, { locationHint: "weur", name: "b" });

    expect(calls[1]?.body).toStrictEqual({ locationHint: "weur", name: "b" });
  });

  it("creates a bucket without a hint when none is given", async () => {
    const { calls, client } = routedClient(absent);

    await findOrCreateR2(client, ACC, { name: "b" });

    expect(calls[1]?.body).toStrictEqual({ name: "b" });
  });

  it("sets the CORS rules with a PUT", async () => {
    const { calls, client } = routedClient({ [`PUT ${buckets}/b/cors`]: {} });
    const rules = [{ allowed: { methods: ["GET" as const], origins: ["https://example.com"] } }];

    await setR2Cors(client, ACC, { bucketName: "b", rules });

    expect(calls[0]?.body).toStrictEqual({ rules });
  });
});

describe("ensureR2CustomDomain", () => {
  const path = "/accounts/acc/r2/buckets/b/domains/custom";
  const target = { bucketName: "b", domain: "cdn.example.com", zoneId: "z" };

  it("attaches a custom domain", async () => {
    const { calls, client } = routedClient({ [`POST ${path}`]: {} });

    expect(await ensureR2CustomDomain(client, ACC, target)).toBe("attached");
    expect(calls[0]?.body).toStrictEqual({ domain: "cdn.example.com", enabled: true, minTLS: "1.2", zoneId: "z" });
  });

  it("reports a domain that is already attached", async () => {
    const { client } = failing("domain already attached");

    expect(await ensureR2CustomDomain(client, ACC, target)).toBe("exists");
  });

  it("rethrows any other failure", async () => {
    const { client } = failing("denied");

    await expect(ensureR2CustomDomain(client, ACC, target)).rejects.toThrow("denied");
  });
});

describe("D1 read replicas", () => {
  const path = "/accounts/acc/d1/database/u1";
  const detail = { name: "db", num_tables: 1, read_replication: { mode: "disabled" }, uuid: "u1" };

  it("reads a database's detail", async () => {
    const { client } = routedClient({ [`GET ${path}`]: detail });

    expect(await getD1Detail(client, ACC, "u1")).toStrictEqual(detail);
  });

  it("reads undefined when the request fails", async () => {
    expect(await getD1Detail(failing("nope").client, ACC, "u1")).toBeUndefined();
  });

  it("turns replication on with a PATCH", async () => {
    const { calls, client } = routedClient({ [`PATCH ${path}`]: {} });

    await enableD1ReadReplicas(client, ACC, "u1");

    expect(calls[0]?.body).toStrictEqual({ read_replication: { mode: "auto" } });
  });
});

describe("findOrCreateTurnstile", () => {
  const widgets = "/accounts/acc/challenges/widgets";
  const config = { domains: ["example.com"], mode: "managed" as const, name: "w", siteKey: "STUB" };
  const sent = { clearance_level: "no_clearance", domains: ["example.com"], mode: "managed", name: "w" };
  const widget = { name: "w", sitekey: "k1" };
  const put = { [`PUT ${widgets}/k1`]: { sitekey: "k1" } };

  it("creates a missing widget", async () => {
    const { calls, client } = routedClient({ [`GET ${widgets}`]: [], [`POST ${widgets}`]: { sitekey: "k" } });

    expect(await findOrCreateTurnstile(client, ACC, config)).toStrictEqual({ sitekey: "k" });
    expect(calls[1]?.body).toStrictEqual(sent);
  });

  it("updates a widget found by name in an array list", async () => {
    const { calls, client } = routedClient({ ...put, [`GET ${widgets}`]: [widget] });

    await findOrCreateTurnstile(client, ACC, config);

    expect(calls[1]?.body).toStrictEqual(sent);
  });

  it("updates a widget found in a result object, with the configured clearance", async () => {
    const { calls, client } = routedClient({ ...put, [`GET ${widgets}`]: { result: [widget] } });

    await findOrCreateTurnstile(client, ACC, { ...config, clearanceLevel: "managed" });

    expect(calls[1]?.body).toStrictEqual({ ...sent, clearance_level: "managed" });
  });
});
