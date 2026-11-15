import { afterEach, beforeEach, expect, it } from "vitest";

import { CONVERSION, type FakeGithub, fakeGithub } from "./__fixtures__/fake-github.ts";
import { convertManifestCode } from "./convert-manifest-code.ts";

let github: FakeGithub;

beforeEach(() => {
  github = fakeGithub();
});

afterEach(async () => {
  await github.close();
});

it("convert manifest code: posts the code to conversions and returns the app's id and secret", async () => {
  const app = await convertManifestCode({ apiBase: github.base, code: "code1", fetcher: fetch });

  expect(github.conversions).toStrictEqual(["/app-manifests/code1/conversions application/vnd.github+json"]);
  expect(app).toStrictEqual({
    clientId: CONVERSION.client_id,
    clientSecret: CONVERSION.client_secret,
    slug: "example-app",
  });
});

it("convert manifest code: throws the request line when GitHub refuses the code", async () => {
  const run = convertManifestCode({ apiBase: github.base, code: "stale", fetcher: fetch });

  await expect(run).rejects.toThrow("GitHub API POST /app-manifests/<code>/conversions: 404");
});
