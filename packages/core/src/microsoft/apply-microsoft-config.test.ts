import { expect, it } from "vitest";

import { applyEdits } from "../provision/apply-edits.ts";
import { bodyText } from "./__fixtures__/body-text.ts";
import { collectLines } from "./__fixtures__/collect-lines.ts";
import { graphFetch, microsoftConfig, microsoftEnv } from "./__fixtures__/microsoft-fixtures.ts";
import { statusFetch } from "./__fixtures__/status-fetch.ts";
import { applyMicrosoftConfig } from "./apply-microsoft-config.ts";

const BASE = "https://graph.microsoft.com/v1.0";
const SECRET = "s3cretvalue-long-1234";
const created = [{ value: [] }, { appId: "app1", id: "obj1" }, { secretText: SECRET }, {}];
const found = [{ value: [{ appId: "app1", displayName: "Example App", id: "obj1" }] }, {}, { secretText: SECRET }];
const foundNoPassword = found.slice(0, 2);
const LOOKUP = "/applications?$filter=displayName eq 'Example%20App'&$select=id,appId,displayName,web,signInAudience";

const TOKEN_FIX =
  "MICROSOFT_GRAPH_API_TOKEN has no global value; run bun repo env set MICROSOFT_GRAPH_API_TOKEN --scope global";

it("apply microsoft: creates a new app and returns its id edit and secret write", async () => {
  const { lines, log } = collectLines();
  const { calls, fetcher } = graphFetch(...created);
  const config = microsoftConfig("STUB");
  const out = await applyMicrosoftConfig({ config, env: microsoftEnv("tok1"), fetcher, log });

  expect(calls.map((call) => `${call.init.method} ${call.url.replace(BASE, "")}`)).toStrictEqual([
    `GET ${LOOKUP}`,
    "POST /applications",
    "POST /applications/obj1/addPassword",
    "POST /servicePrincipals",
  ]);
  expect(calls[1]?.init.headers).toStrictEqual({ Authorization: "Bearer tok1", "Content-Type": "application/json" });
  expect(JSON.parse(bodyText(calls[1]?.init ?? {}))).toStrictEqual({
    displayName: "Example App",
    signInAudience: "AzureADandPersonalMicrosoftAccount",
    web: { redirectUris: ["https://example.com/v1/auth/oauth/microsoft/callback"] },
  });
  expect(lines).toStrictEqual([
    "  OAuth:",
    '    [prod] "Example App" ...',
    "    → clientId: app1",
    "    → secret: s3cret…g-1234",
  ]);
  expect(out.secrets).toStrictEqual([{ key: "MICROSOFT_CLIENT_SECRET", scope: "prod", value: SECRET }]);
});

it("apply microsoft: the clientId edit fills only the STUB and holds no secret", async () => {
  const { log } = collectLines();
  const { fetcher } = graphFetch(...created);
  const out = await applyMicrosoftConfig({ config: microsoftConfig("STUB"), env: microsoftEnv("tok1"), fetcher, log });
  const before = '{ appName: "Example App", clientId: "STUB", x: 1 }';

  expect(JSON.stringify(out.edits)).not.toContain(SECRET);
  expect(applyEdits(before, out.edits)).toBe('{ appName: "Example App", clientId: "app1", x: 1 }');
});

it("apply microsoft: a found app with an existing secret gets no new password", async () => {
  const { lines, log } = collectLines();
  const { calls, fetcher } = graphFetch(...foundNoPassword);
  const env = microsoftEnv("tok1", "already-set");
  const out = await applyMicrosoftConfig({ config: microsoftConfig("app1"), env, fetcher, log });

  expect(calls.map((call) => `${call.init.method} ${call.url.replace(BASE, "")}`)).toStrictEqual([
    `GET ${LOOKUP}`,
    "PATCH /applications/obj1",
  ]);
  expect(lines.some((line) => line.includes("secret"))).toBe(false);
  expect(out).toStrictEqual({ edits: [], secrets: [] });
});

it("apply microsoft: a found app without a secret gets a password and a secret write", async () => {
  const { log } = collectLines();
  const { calls, fetcher } = graphFetch(...found);
  const out = await applyMicrosoftConfig({ config: microsoftConfig("app1"), env: microsoftEnv("tok1"), fetcher, log });

  expect(calls.map((call) => call.init.method)).toStrictEqual(["GET", "PATCH", "POST"]);
  expect(out).toStrictEqual({ edits: [], secrets: [{ key: "MICROSOFT_CLIENT_SECRET", scope: "prod", value: SECRET }] });
});

it("apply microsoft: throws the fix line when the global graph token is missing", async () => {
  const { log } = collectLines();
  const { fetcher } = graphFetch({});
  const run = applyMicrosoftConfig({ config: microsoftConfig("STUB"), env: microsoftEnv(undefined), fetcher, log });

  await expect(run).rejects.toThrow(TOKEN_FIX);
});

it("apply microsoft: throws the Graph request line when a call fails", async () => {
  const { log } = collectLines();
  const fetcher = statusFetch(403);
  const run = applyMicrosoftConfig({ config: microsoftConfig("STUB"), env: microsoftEnv("tok1"), fetcher, log });

  await expect(run).rejects.toThrow(`Graph API GET ${LOOKUP}`);
});

it("apply microsoft: does nothing without oauth", async () => {
  const { log } = collectLines();
  const out = await applyMicrosoftConfig({ config: {}, env: microsoftEnv(undefined), log });

  expect(out).toStrictEqual({ edits: [], secrets: [] });
});
