import { expect, it } from "vitest";

import { githubConfig, githubEnv, jsonFetch } from "./__fixtures__/github-fixtures.ts";
import { verifyGithubConfig } from "./verify-github-config.ts";

const entry = {
  appName: "Example App",
  clientId: "matches",
  env: "prod",
  exists: true,
  hasSecret: true,
  slug: "example-app",
};

it("verify github: finds the app by its slug with no auth and checks its client id", async () => {
  const { calls, fetcher } = jsonFetch(200, { client_id: "Iv1.abc123", slug: "example-app" });
  const result = await verifyGithubConfig({ config: githubConfig("Iv1.abc123"), env: githubEnv("set"), fetcher });

  expect(calls.map((call) => [call.url, call.init.method, call.init.headers])).toStrictEqual([
    ["https://api.github.com/apps/example-app", "GET", { Accept: "application/vnd.github+json" }],
  ]);
  expect(result.oauth).toStrictEqual([entry]);
});

it("verify github: reports a client id that differs from the live app", async () => {
  const { fetcher } = jsonFetch(200, { client_id: "Iv1.other" });
  const result = await verifyGithubConfig({ config: githubConfig("Iv1.abc123"), env: githubEnv("set"), fetcher });

  expect(result.oauth).toStrictEqual([{ ...entry, clientId: "differs" }]);
});

it("verify github: reports a missing app", async () => {
  const { fetcher } = jsonFetch(404, { message: "Not Found" });
  const result = await verifyGithubConfig({ config: githubConfig("Iv1.abc123"), env: githubEnv("set"), fetcher });

  expect(result.oauth).toStrictEqual([{ ...entry, clientId: "unchecked", exists: false }]);
});

it("verify github: reports a missing secret", async () => {
  const { fetcher } = jsonFetch(200, { client_id: "Iv1.abc123" });
  const result = await verifyGithubConfig({ config: githubConfig("Iv1.abc123"), env: githubEnv(), fetcher });

  expect(result.oauth).toStrictEqual([{ ...entry, hasSecret: false }]);
});

it("verify github: a STUB scope is missing with no call", async () => {
  const { calls, fetcher } = jsonFetch(200, {});
  const result = await verifyGithubConfig({ config: githubConfig("STUB"), env: githubEnv(), fetcher });

  expect(calls).toHaveLength(0);
  expect(result.oauth).toStrictEqual([{ ...entry, clientId: "unchecked", exists: false, hasSecret: false }]);
});

it("verify github: the slug is the app name lowercased with single dashes", async () => {
  const { calls, fetcher } = jsonFetch(404);

  await verifyGithubConfig({
    config: githubConfig("Iv1.x", { appName: " My  Cool_App! " }),
    env: githubEnv(),
    fetcher,
  });

  expect(calls[0]?.url).toBe("https://api.github.com/apps/my-cool-app");
});
