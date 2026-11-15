import { expect, it } from "vitest";

import { logLines } from "../provision/__fixtures__/log-lines.ts";
import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { aiInstance, aiSearchFetch } from "./__fixtures__/ai-search-fetch.ts";
import { cloudflareConfig } from "./__fixtures__/cloudflare-config.ts";
import { globalEnv } from "./__fixtures__/global-env.ts";
import { zoneAnswer } from "./__fixtures__/zone-answer.ts";
import { zoneGet } from "./zone-get.ts";

const ENV = globalEnv({ CLOUDFLARE_API_TOKEN: "cfut_test" });

it("zoneGet prints the heading, rules, drift, declared bindings, R2, AI Search and Turnstile", async () => {
  const { client } = fakeClient(zoneAnswer());
  const { lines, log } = logLines();
  const { fetcher } = aiSearchFetch({ listed: [aiInstance("search-dev")] });
  const dataSource = { source: "https://example.com/s.xml", type: "web-crawler" as const };
  const instance = { dataSource, embeddingModel: "m", instanceName: "search-dev" };
  const bindings = { dev: { ai_search_instances: { SEARCH: instance }, kv_namespaces: { KV: { id: "kv1" } } } };
  const target = { accountId: "acc", config: cloudflareConfig({ bindings }), env: ENV, fetcher, name: "apps/web" };

  await zoneGet(client, target, log);

  expect(lines).toContain("\n Zone: apps/web (example.com) [zid]");
  expect(lines).toContain("  Transforms: declared=0 live=0");
  expect(lines).toContain("  Bindings [dev]:");
  expect(lines).toContain('    { "binding": "KV", "id": "kv1" }');
  expect(lines).toContain("    [dev] search-dev (m) — ✓ [status: active]");
  expect(lines.slice(-2)).toStrictEqual(["  Turnstile:", "    (none declared)"]);
});
