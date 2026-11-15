import { afterEach, beforeEach, expect, it } from "vitest";

import { type FakeGithub, fakeGithub } from "./__fixtures__/fake-github.ts";
import { followForm } from "./__fixtures__/follow-form.ts";
import { githubOAuth } from "./__fixtures__/github-fixtures.ts";
import { runManifestFlow } from "./manifest-flow.ts";

let github: FakeGithub;

beforeEach(() => {
  github = fakeGithub();
});

afterEach(async () => {
  await github.close();
});

it("manifest flow: serves the form, takes the callback with the matching state and returns its code", async () => {
  const opened: string[] = [];

  const code = await runManifestFlow({
    oauth: githubOAuth("STUB"),
    openUrl: (url) => {
      opened.push(url);
      void followForm(url);
    },
    timeoutMs: 5000,
    webBase: github.base,
  });

  expect(code).toBe("code1");
  expect(opened[0]).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/$/);
  expect(github.forms[0]?.path).toMatch(/^\/settings\/apps\/new\?state=[0-9a-f]{32}$/);
  expect(github.forms[0]?.manifest.redirect_url).toBe(`${opened[0] ?? ""}callback`);
});

it("manifest flow: an org app posts to the org's settings", async () => {
  await runManifestFlow({
    oauth: githubOAuth("STUB", { org: "acme" }),
    openUrl: (url) => void followForm(url),
    timeoutMs: 5000,
    webBase: github.base,
  });

  expect(github.forms[0]?.path).toMatch(/^\/organizations\/acme\/settings\/apps\/new\?state=/);
});

it("manifest flow: rejects a callback with a wrong state and keeps waiting for the right one", async () => {
  const statuses: number[] = [];

  const code = await runManifestFlow({
    oauth: githubOAuth("STUB"),
    openUrl: (url) => {
      void (async () => {
        const wrong = await fetch(`${url}callback?code=evil&state=wrong`);

        statuses.push(wrong.status);
        await followForm(url);
      })();
    },
    timeoutMs: 5000,
    webBase: github.base,
  });

  expect(code).toBe("code1");
  expect(statuses[0]).toBe(400);
});

it("manifest flow: gives up after the timeout and closes the server", async () => {
  const opened: string[] = [];

  const run = runManifestFlow({
    oauth: githubOAuth("STUB"),
    openUrl: (url) => opened.push(url),
    timeoutMs: 50,
    webBase: github.base,
  });

  await expect(run).rejects.toThrow("no answer from GitHub within 1 s; run infra set again");
  await expect(fetch(opened[0] ?? "")).rejects.toThrow(/connect|refused|Unable/i);
});
