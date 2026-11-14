import { expect, it } from "vitest";

import { fakeEnv } from "../access/__fixtures__/fake-env.ts";
import { globalEnv } from "./__fixtures__/global-env.ts";
import { verifyR2Credentials } from "./verify-r2-credentials.ts";

const ENDPOINT = "https://abc123.r2.cloudflarestorage.com";

it("verifyR2Credentials accepts a key id, a scoped secret and an R2 endpoint", () => {
  const env = fakeEnv("prod", { R2_SECRET_ACCESS_KEY: "secret" });

  expect(verifyR2Credentials({ accessKeyId: "key", endpoint: ENDPOINT }, env)).toStrictEqual({
    endpointValid: true,
    hasCredentials: true,
  });
});

it("verifyR2Credentials reports missing keys when the key id is empty or no scope has the secret", () => {
  const env = fakeEnv("prod", { R2_SECRET_ACCESS_KEY: "secret" });

  expect(verifyR2Credentials({ accessKeyId: "", endpoint: ENDPOINT }, env).hasCredentials).toBe(false);
  expect(verifyR2Credentials({ accessKeyId: "key", endpoint: ENDPOINT }, globalEnv({})).hasCredentials).toBe(false);
});

it("verifyR2Credentials rejects an endpoint that is not an R2 S3 endpoint", () => {
  const env = fakeEnv("dev", { R2_SECRET_ACCESS_KEY: "secret" });

  expect(verifyR2Credentials({ accessKeyId: "key", endpoint: "https://example.com" }, env).endpointValid).toBe(false);
});
