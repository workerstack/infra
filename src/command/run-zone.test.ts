import { expect, it } from "vitest";

import type { CfClient } from "../api/client.ts";
import { logLines } from "../provision/__fixtures__/log-lines.ts";
import { cloudflareConfig } from "../runner/__fixtures__/cloudflare-config.ts";
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
  };

  const get = testHost([product("apps/web")]);
  const set = testHost([product("apps/web")]);

  expect(await runZoneGet([], get.host, deps)).toBe(1);
  expect(await runZoneSet([], set.host, deps)).toBe(1);
  expect(get.err).toStrictEqual(["infra zone-get: apps/web: no cloudflare zone in the config"]);
  expect(set.err).toStrictEqual(["infra zone-set: apps/web: no cloudflare zone in the config"]);
});

it("zone-set applies only the zone config", async () => {
  const applied: string[] = [];

  const deps = {
    applyZoneConfig: (_client: CfClient, zone: { domain: string }) => {
      applied.push(zone.domain);

      return Promise.resolve();
    },
    client: () => client,
    log: logLines().log,
  };

  const web = product("apps/web", { cloudflare: cloudflareConfig() });

  expect(await runZoneSet([], testHost([web]).host, deps)).toBe(0);
  expect(applied).toStrictEqual(["example.com"]);
});
