import { expect, it } from "vitest";

import { routedClient } from "../provision/__fixtures__/routed-client.ts";
import type { EnvBindings } from "../schema/bindings.ts";
import { verifyR2Config } from "./verify-r2-config.ts";

const BUCKET = "/accounts/acc/r2/buckets/my-bucket";

const ROUTES = {
  [`GET ${BUCKET}`]: { location: "ENAM", name: "my-bucket" },
  [`GET ${BUCKET}/cors`]: { rules: [] },
};

function bucketBindings(extra: { customDomains?: string[]; locationHint?: "enam" | "weur" } = {}): EnvBindings {
  return { r2_buckets: { MY_BUCKET: { bucket_name: "my-bucket", ...extra } } };
}

it("verifyR2Config sets locationMatches true when the config has no locationHint", async () => {
  const { client } = routedClient(ROUTES);

  const results = await verifyR2Config(client, "acc", { dev: bucketBindings() });

  expect(results[0]?.buckets[0]?.locationMatches).toBe(true);
  expect(results[0]?.buckets[0]?.locationHint).toBeUndefined();
});

it("verifyR2Config matches the Cloudflare location against the hint case-insensitively", async () => {
  const { client } = routedClient(ROUTES);

  const results = await verifyR2Config(client, "acc", { dev: bucketBindings({ locationHint: "enam" }) });

  expect(results[0]?.buckets[0]?.locationMatches).toBe(true);
  expect(results[0]?.buckets[0]?.locationHint).toBe("enam");
  expect(results[0]?.buckets[0]?.location).toBe("ENAM");
});

it("verifyR2Config sets locationMatches false when the location differs from the hint", async () => {
  const { client } = routedClient(ROUTES);

  const results = await verifyR2Config(client, "acc", { dev: bucketBindings({ locationHint: "weur" }) });

  expect(results[0]?.buckets[0]?.locationMatches).toBe(false);
  expect(results[0]?.buckets[0]?.locationHint).toBe("weur");
});

it("verifyR2Config reads each custom domain, and marks an unreadable one missing", async () => {
  const domains = `${BUCKET}/domains/custom`;
  const live = { domain: "cdn.example.com", enabled: true, status: { ownership: "active", ssl: "active" } };
  const { client } = routedClient({ ...ROUTES, [`GET ${domains}/cdn.example.com`]: live });

  const results = await verifyR2Config(client, "acc", {
    dev: bucketBindings({ customDomains: ["cdn.example.com", "gone.example.com"] }),
  });

  expect(results[0]?.buckets[0]?.customDomains).toStrictEqual([
    { domain: "cdn.example.com", enabled: true, ownership: "active", ssl: "active" },
    { domain: "gone.example.com", enabled: false, ownership: "missing", ssl: "missing" },
  ]);
});

it("verifyR2Config leaves out an env with no bucket", async () => {
  const { calls, client } = routedClient({});

  const results = await verifyR2Config(client, "acc", { dev: { kv_namespaces: { KV: { id: "k" } } } });

  expect(results).toStrictEqual([]);
  expect(calls).toStrictEqual([]);
});
