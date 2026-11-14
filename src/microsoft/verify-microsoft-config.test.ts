import { expect, it } from "vitest";

import { graphFetch, microsoftConfig, microsoftEnv } from "./__fixtures__/microsoft-fixtures.ts";
import { statusFetch } from "./__fixtures__/status-fetch.ts";
import { verifyMicrosoftConfig } from "./verify-microsoft-config.ts";

const app = {
  appId: "app1",
  displayName: "Example App",
  id: "obj1",
  passwordCredentials: [{}, {}],
  signInAudience: "AzureADMyOrg",
  web: { redirectUris: ["https://example.com/cb"] },
};

const format = {
  appName: "Example App",
  env: "prod",
  exists: false,
  redirectUris: ["https://example.com"],
  secretCount: 0,
  signInAudience: "AzureADandPersonalMicrosoftAccount",
};

const LOOKUP =
  "https://graph.microsoft.com/v1.0/applications?$filter=appId eq 'app1'" +
  "&$select=id,appId,displayName,web,signInAudience,passwordCredentials";

it("verify microsoft: looks the app up by client id with the Bearer token", async () => {
  const { calls, fetcher } = graphFetch({ value: [app] });
  const env = microsoftEnv("tok1");
  const result = await verifyMicrosoftConfig({ config: microsoftConfig("app1"), env, fetcher });
  const found = { ...format, exists: true, redirectUris: ["https://example.com/cb"] };

  expect(calls[0]?.url).toBe(LOOKUP);
  expect(calls[0]?.init.method).toBe("GET");
  expect(calls[0]?.init.headers).toStrictEqual({ Authorization: "Bearer tok1", "Content-Type": "application/json" });
  expect(result.oauth).toStrictEqual([{ ...found, secretCount: 2, signInAudience: "AzureADMyOrg" }]);
});

it("verify microsoft: reports the config only, with no call, when there is no graph token", async () => {
  const { calls, fetcher } = graphFetch({});
  const env = microsoftEnv(undefined);
  const result = await verifyMicrosoftConfig({ config: microsoftConfig("app1"), env, fetcher });

  expect(result.oauth).toStrictEqual([format]);
  expect(calls).toHaveLength(0);
});

it("verify microsoft: reports a STUB client id as missing without a call", async () => {
  const { calls, fetcher } = graphFetch({});

  const result = await verifyMicrosoftConfig({
    config: microsoftConfig("STUB"),
    env: microsoftEnv("tok1"),
    fetcher,
  });

  expect(result.oauth).toStrictEqual([format]);
  expect(calls).toHaveLength(0);
});

it("verify microsoft: reports a missing app when Graph fails", async () => {
  const fetcher = statusFetch(500);

  const result = await verifyMicrosoftConfig({
    config: microsoftConfig("app1"),
    env: microsoftEnv("tok1"),
    fetcher,
  });

  expect(result.oauth).toStrictEqual([{ ...format, signInAudience: "unknown" }]);
});
