import { describe, expect, it } from "vitest";

import type { ZoneConfigInput } from "../schema/zone.ts";
import { parseZoneConfig } from "../schema/zone.ts";
import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { getCloudConnectorRules, setCloudConnectorRules } from "./cloud-connector.ts";

const PATH = "/zones/zid/cloud_connector/rules";
const PATH_EXPRESSION = 'starts_with(http.request.uri.path, "/cdn/p/")';

function config(rules: ZoneConfigInput["cloudConnectors"] = []): ReturnType<typeof parseZoneConfig> {
  return parseZoneConfig({ cloudConnectors: rules, domain: "example.com", zoneId: "zid" });
}

describe("setCloudConnectorRules", () => {
  it("PUTs an empty array when no rules are declared", async () => {
    const { calls, client } = fakeClient(() => []);

    await setCloudConnectorRules(client, config([]));

    expect(calls).toStrictEqual([{ body: [], method: "PUT", path: PATH }]);
  });
});

describe("setCloudConnectorRules mapping", () => {
  it("maps a rule to the CF body with parameters.host", async () => {
    const { calls, client } = fakeClient(() => []);

    await setCloudConnectorRules(
      client,
      config([
        {
          description: "CDN to R2",
          enabled: true,
          expression: PATH_EXPRESSION,
          host: "cdn.example.com",
          provider: "cloudflare_r2",
        },
      ]),
    );

    expect(calls[0]?.body).toStrictEqual([
      {
        description: "CDN to R2",
        enabled: true,
        expression: PATH_EXPRESSION,
        parameters: { host: "cdn.example.com" },
        provider: "cloudflare_r2",
      },
    ]);
  });
});

describe("setCloudConnectorRules order", () => {
  it("keeps the declared order and defaults the provider to cloudflare_r2", async () => {
    const { calls, client } = fakeClient(() => []);

    await setCloudConnectorRules(
      client,
      config([
        { description: "first", expression: 'starts_with(http.request.uri.path, "/a/")', host: "a.example.com" },
        { description: "second", expression: 'starts_with(http.request.uri.path, "/b/")', host: "b.example.com" },
      ]),
    );

    expect(calls[0]?.body).toMatchObject([
      { description: "first", provider: "cloudflare_r2" },
      { description: "second", provider: "cloudflare_r2" },
    ]);
  });
});

describe("getCloudConnectorRules", () => {
  it("flattens parameters.host and drops the id", async () => {
    const { calls, client } = fakeClient(() => [
      {
        description: "CDN to R2",
        enabled: true,
        expression: PATH_EXPRESSION,
        id: "abc123",
        parameters: { host: "cdn.example.com" },
        provider: "cloudflare_r2",
      },
    ]);

    expect(await getCloudConnectorRules(client)).toStrictEqual([
      {
        description: "CDN to R2",
        enabled: true,
        expression: PATH_EXPRESSION,
        host: "cdn.example.com",
        provider: "cloudflare_r2",
      },
    ]);
    expect(calls).toStrictEqual([{ body: undefined, method: "GET", path: PATH }]);
  });
});

describe("getCloudConnectorRules empty", () => {
  it("returns an empty list for an empty response", async () => {
    const { client } = fakeClient(() => []);

    expect(await getCloudConnectorRules(client)).toStrictEqual([]);
  });
});

describe("getCloudConnectorRules defaults", () => {
  it("fills the provider and enabled defaults when CF omits them", async () => {
    const { client } = fakeClient(() => [{ description: "x", expression: "E", parameters: { host: "H" } }]);

    expect(await getCloudConnectorRules(client)).toStrictEqual([
      { description: "x", enabled: true, expression: "E", host: "H", provider: "cloudflare_r2" },
    ]);
  });
});
