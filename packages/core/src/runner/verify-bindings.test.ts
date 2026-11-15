import { expect, it } from "vitest";

import { routedClient } from "../provision/__fixtures__/routed-client.ts";
import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { verifyBindings } from "./verify-bindings.ts";

const A = "/accounts/acc";

it("verifyBindings emits an AE entry with the note 'auto-created on first write' and makes no request", async () => {
  const { calls, client } = fakeClient(() => ({}));

  const results = await verifyBindings(client, "acc", {
    dev: { analytics_engine_datasets: { ANALYTICS: { dataset: "my_analytics" } } },
  });

  const ae = results[0]?.bindings.find((binding) => binding.type === "AE");

  expect(ae?.exists).toBe(true);
  expect(ae?.name).toBe("my_analytics");
  expect(ae?.note).toContain("auto-created on first write");
  expect(calls).toStrictEqual([]);
});

it("verifyBindings reports D1 with its read replication mode, KV and Queue by existence", async () => {
  const { client } = routedClient({
    [`GET ${A}/d1/database`]: [{ name: "db", uuid: "u1" }],
    [`GET ${A}/d1/database/u1`]: { name: "db", num_tables: 1, read_replication: { mode: "auto" }, uuid: "u1" },
    [`GET ${A}/queues`]: [{ queue_name: "jobs" }],
    [`GET ${A}/storage/kv/namespaces/kv1`]: {},
  });

  const results = await verifyBindings(client, "acc", {
    dev: {
      d1_databases: { DB: { database_id: "u1", database_name: "db" } },
      kv_namespaces: { KV: { id: "kv1" } },
      queues: { Q: { queue: "jobs" }, Q2: { queue: "gone" } },
    },
  });

  expect(results[0]?.bindings).toStrictEqual([
    { binding: "DB", exists: true, name: "db", readReplicas: "auto", type: "D1" },
    { binding: "KV", exists: true, name: "kv1", type: "KV" },
    { binding: "Q", exists: true, name: "jobs", type: "Queue" },
    { binding: "Q2", exists: false, name: "gone", type: "Queue" },
  ]);
});

it("verifyBindings leaves out an env with no bindings and a missing KV is not found", async () => {
  const { client } = routedClient({});

  const results = await verifyBindings(client, "acc", { dev: {}, prod: { kv_namespaces: { KV: { id: "nope" } } } });

  expect(results).toStrictEqual([
    { bindings: [{ binding: "KV", exists: false, name: "nope", type: "KV" }], env: "prod" },
  ]);
});
