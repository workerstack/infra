import { afterEach, beforeEach, expect, it } from "vitest";

import { collectLines } from "../microsoft/__fixtures__/collect-lines.ts";
import { applyEdits } from "../provision/apply-edits.ts";
import { CONVERSION, type FakeGithub, fakeGithub } from "./__fixtures__/fake-github.ts";
import { followForm } from "./__fixtures__/follow-form.ts";
import { githubConfig, githubEnv, jsonFetch } from "./__fixtures__/github-fixtures.ts";
import { applyGithubConfig } from "./apply-github-config.ts";

let github: FakeGithub;

beforeEach(() => {
  github = fakeGithub();
});

afterEach(async () => {
  await github.close();
});

const STUB_FIX = 'github.oauth.prod has clientId "STUB" and needs the browser; run infra set in a terminal';

it("apply github: a STUB scope runs the manifest flow and returns the id edit and the secret write", async () => {
  const { lines, log } = collectLines();
  const opened: string[] = [];

  const out = await applyGithubConfig({
    apiBase: github.base,
    canPrompt: true,
    config: githubConfig("STUB"),
    env: githubEnv(),
    log,
    openUrl: (url) => {
      opened.push(url);
      void followForm(url);
    },
    webBase: github.base,
  });

  expect(out.secrets).toStrictEqual([{ key: "GITHUB_CLIENT_SECRET", scope: "prod", value: CONVERSION.client_secret }]);
  expect(JSON.stringify(out.edits)).not.toContain(CONVERSION.client_secret);
  expect(applyEdits('{ appName: "Example App", clientId: "STUB" }', out.edits)).toBe(
    '{ appName: "Example App", clientId: "Iv1.abc123" }',
  );
  expect(lines).toStrictEqual([
    "  OAuth:",
    '    [prod] "Example App" ...',
    `    → create the app in the browser: ${opened[0] ?? ""}`,
    "    → clientId: Iv1.abc123",
    "    → secret: gh-cli…e-1234",
    "    → no private key stored: sign-in needs only the client id and secret",
  ]);
});

it("apply github: a scope with a real id and a secret does nothing", async () => {
  const { lines, log } = collectLines();
  const { calls, fetcher } = jsonFetch(500);
  const opened: string[] = [];
  const config = githubConfig("Iv1.abc123");

  const out = await applyGithubConfig({
    canPrompt: true,
    config,
    env: githubEnv("set"),
    fetcher,
    log,
    openUrl: (url) => opened.push(url),
  });

  expect(out).toStrictEqual({ edits: [], secrets: [] });
  expect(calls).toHaveLength(0);
  expect(opened).toHaveLength(0);
  expect(lines).toStrictEqual(["  OAuth:", '    [prod] "Example App" ✓ Iv1.abc123']);
});

it("apply github: a real id without a secret prints how to add one", async () => {
  const { lines, log } = collectLines();
  const out = await applyGithubConfig({ canPrompt: true, config: githubConfig("Iv1.abc123"), env: githubEnv(), log });

  expect(out).toStrictEqual({ edits: [], secrets: [] });
  expect(lines.at(-1)).toBe(
    "    → no GITHUB_CLIENT_SECRET: generate one in the app's settings, then run " +
      "bun repo env set GITHUB_CLIENT_SECRET --scope prod",
  );
});

it("apply github: a STUB scope under a test or with no terminal fails naming the scope", async () => {
  const { log } = collectLines();
  const run = applyGithubConfig({ config: githubConfig("STUB"), env: githubEnv(), log });

  await expect(run).rejects.toThrow(STUB_FIX);
});

it("apply github: does nothing without oauth", async () => {
  const { lines, log } = collectLines();

  expect(await applyGithubConfig({ config: {}, env: githubEnv(), log })).toStrictEqual({ edits: [], secrets: [] });
  expect(lines).toStrictEqual([]);
});
