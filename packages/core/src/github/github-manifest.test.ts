import { expect, it } from "vitest";

import { githubOAuth } from "./__fixtures__/github-fixtures.ts";
import { githubManifest } from "./github-manifest.ts";
import { manifestFormUrl } from "./manifest-form-url.ts";

const REDIRECT = "http://127.0.0.1:1234/callback";

it("github manifest: names the app, a callback per origin, the redirect back, an off hook and email read", () => {
  expect(githubManifest({ oauth: githubOAuth("STUB"), redirectUrl: REDIRECT })).toStrictEqual({
    callback_urls: [
      "https://example.com/v1/auth/oauth/github/callback",
      "https://www.example.com/v1/auth/oauth/github/callback",
    ],
    default_permissions: { email_addresses: "read" },
    hook_attributes: { active: false, url: "https://example.com" },
    name: "Example App",
    public: true,
    redirect_url: REDIRECT,
    url: "https://example.com",
  });
});

it("github manifest: a private app says so", () => {
  expect(githubManifest({ oauth: githubOAuth("STUB", { public: false }), redirectUrl: REDIRECT }).public).toBe(false);
});

it("github manifest: a user app posts to the user's settings with the state", () => {
  expect(manifestFormUrl({ state: "st1", webBase: "https://github.com" })).toBe(
    "https://github.com/settings/apps/new?state=st1",
  );
});

it("github manifest: an org app posts to the org's settings with the state", () => {
  expect(manifestFormUrl({ org: "acme", state: "st1", webBase: "https://github.com" })).toBe(
    "https://github.com/organizations/acme/settings/apps/new?state=st1",
  );
});
