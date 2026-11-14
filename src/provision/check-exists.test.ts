import { describe, expect, it } from "vitest";

import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { routedClient } from "./__fixtures__/routed-client.ts";
import { checkD1Exists } from "./check-d1-exists.ts";
import { checkKVExists } from "./check-kv-exists.ts";
import { checkQueueExists } from "./check-queue-exists.ts";

const A = "/accounts/acc";

function failing(): ReturnType<typeof fakeClient> {
  return fakeClient(() => {
    throw new Error("CF API failed");
  });
}

describe("checkD1Exists", () => {
  it("returns the uuid of the database with the name", async () => {
    const { calls, client } = routedClient({ [`GET ${A}/d1/database`]: [{ name: "db", uuid: "u1" }] });

    expect(await checkD1Exists(client, "acc", "db")).toStrictEqual({ exists: true, uuid: "u1" });
    expect(calls[0]?.path).toBe(`${A}/d1/database?name=db&per_page=10`);
  });

  it("is missing for another name or a failed request", async () => {
    const { client } = routedClient({ [`GET ${A}/d1/database`]: [{ name: "other", uuid: "u2" }] });

    expect(await checkD1Exists(client, "acc", "db")).toStrictEqual({ exists: false });
    expect(await checkD1Exists(failing().client, "acc", "db")).toStrictEqual({ exists: false });
  });
});

describe("checkKVExists", () => {
  it("is true when the namespace is found and false when the request fails", async () => {
    const { client } = routedClient({ [`GET ${A}/storage/kv/namespaces/k1`]: {} });

    expect(await checkKVExists(client, "acc", "k1")).toBe(true);
    expect(await checkKVExists(failing().client, "acc", "k1")).toBe(false);
  });
});

describe("checkQueueExists", () => {
  const queues = { [`GET ${A}/queues`]: [{ queue_id: "q1", queue_name: "jobs" }] };

  it("is true for a listed queue and false for an unlisted one", async () => {
    const { client } = routedClient(queues);

    expect(await checkQueueExists(client, "acc", "jobs")).toBe(true);
    expect(await checkQueueExists(client, "acc", "other")).toBe(false);
  });

  it("is false when the request fails", async () => {
    expect(await checkQueueExists(failing().client, "acc", "jobs")).toBe(false);
  });
});
