import { expect, it } from "vitest";

import type { CfClient } from "../api/client.ts";
import { logLines } from "../provision/__fixtures__/log-lines.ts";
import { applyAnswer } from "../runner/__fixtures__/apply-answer.ts";
import { cloudflareConfig } from "../runner/__fixtures__/cloudflare-config.ts";
import { applyZoneConfig } from "../runner/apply-zone-config.ts";
import { fakeClient, writes } from "../shared/__fixtures__/fake-client.ts";
import { fakeRedirect } from "./__fixtures__/set-deps.ts";
import { product, testHost } from "./__fixtures__/test-host.ts";
import { runZoneGet } from "./run-zone-get.ts";
import { runZoneSet } from "./run-zone-set.ts";

const client: CfClient = { request: () => Promise.reject(new Error("unused")), zoneId: "zid" };

it("zone-get hands the zone and the account to the runner", async () => {
  const seen: string[] = [];

  const deps = {
    client: () => client,
    log: logLines().log,
    zoneGet: (_client: CfClient, target: { accountId: string; name: string }) => {
      seen.push(`${target.name} ${target.accountId}`);

      return Promise.resolve();
    },
  };

  const web = product("apps/web", { cloudflare: cloudflareConfig() });

  expect(await runZoneGet([], testHost([web]).host, deps)).toBe(0);
  expect(seen).toStrictEqual(["apps/web acc"]);
});

it("zone-get and zone-set fail a product with no cloudflare zone", async () => {
  const deps = {
    applyZoneConfig: () => Promise.resolve(),
    client: () => client,
    log: logLines().log,
    zoneGet: () => Promise.resolve(),
    zoneRedirects: () => Promise.resolve([]),
  };

  const get = testHost([product("apps/web")]);
  const set = testHost([product("apps/web")]);

  expect(await runZoneGet([], get.host, deps)).toBe(1);
  expect(await runZoneSet([], set.host, deps)).toBe(1);
  expect(get.err).toStrictEqual(["infra zone-get: apps/web: no cloudflare zone in the config"]);
  expect(set.err).toStrictEqual(["infra zone-set: apps/web: no cloudflare zone in the config"]);
});

it("zone-set applies only the zone config", async () => {
  const roots: string[] = [];
  const applied: string[] = [];

  const deps = {
    applyZoneConfig: (_client: CfClient, zone: { domain: string }) => {
      applied.push(zone.domain);

      return Promise.resolve();
    },
    client: () => client,
    log: logLines().log,
    zoneRedirects: (root: string) => {
      roots.push(root);

      return Promise.resolve([]);
    },
  };

  const web = product("apps/web", { cloudflare: cloudflareConfig() });

  expect(await runZoneSet([], testHost([web]).host, deps)).toBe(0);
  expect(applied).toStrictEqual(["example.com"]);
  expect(roots).toStrictEqual(["/repo/apps/web"]);
});

it("zone-set writes the product's redirect list to the redirect phase, right after the rate limits", async () => {
  const { calls, client: zone } = fakeClient(applyAnswer());
  const { lines, log } = logLines();

  const deps = {
    applyZoneConfig,
    client: () => zone,
    log,
    zoneRedirects: (root: string) => Promise.resolve([fakeRedirect(root)]),
  };

  expect(await runZoneSet([], testHost([product("apps/web", { cloudflare: cloudflareConfig() })]).host, deps)).toBe(0);

  const heads = lines.filter((line) => line.endsWith(" ..."));
  const redirect = writes(calls).find((call) => JSON.stringify(call.body).includes("locale /repo/apps/web"));

  expect(heads.slice(0, 4)).toStrictEqual(["  WAF ...", "  Rate limits ...", "  Redirects ...", "  Transforms ..."]);
  expect(redirect?.path).toContain("/rulesets");
});
