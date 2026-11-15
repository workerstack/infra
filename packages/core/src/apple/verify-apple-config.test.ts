import { expect, it } from "vitest";

import { fakeFetch } from "../api/__fixtures__/fake-fetch.ts";
import { appleConfig, appleEnv, applePrivateKey } from "./__fixtures__/apple-fixtures.ts";
import { rejectingFetch } from "./__fixtures__/rejecting-fetch.ts";
import { verifyAppleConfig } from "./verify-apple-config.ts";

const entry = {
  env: "prod",
  keyId: "KEY1234567",
  keyValid: true,
  redirectOrigins: ["https://example.com", "https://www.example.com"],
  serviceId: "com.example.auth",
  teamId: "TEAM123456",
};

it("verify apple: GETs the Apple JWKS and reports a valid key", async () => {
  const { calls, fetcher } = fakeFetch({ keys: [] });
  const env = appleEnv(await applePrivateKey());
  const result = await verifyAppleConfig({ config: appleConfig, env, fetcher });

  expect(calls).toHaveLength(1);
  expect(calls[0]?.url).toBe("https://appleid.apple.com/auth/keys");
  expect(calls[0]?.init.method).toBe("GET");
  expect(result).toStrictEqual({ jwksReachable: true, oauth: [entry] });
});

it("verify apple: reports an unreachable JWKS and a key that does not import", async () => {
  const result = await verifyAppleConfig({
    config: appleConfig,
    env: appleEnv("not a key"),
    fetcher: rejectingFetch,
  });

  expect(result.jwksReachable).toBe(false);
  expect(result.oauth[0]?.keyValid).toBe(false);
});

it("verify apple: throws the fix line when the scope has no private key", async () => {
  const { fetcher } = fakeFetch({});
  const run = verifyAppleConfig({ config: appleConfig, env: appleEnv(undefined), fetcher });

  await expect(run).rejects.toThrow(
    "APPLE_PRIVATE_KEY has no prod value; run bun repo env set APPLE_PRIVATE_KEY --scope prod",
  );
});

it("verify apple: lists no scope when the config has no oauth", async () => {
  const { fetcher } = fakeFetch({});
  const result = await verifyAppleConfig({ config: {}, env: appleEnv(undefined), fetcher });

  expect(result.oauth).toStrictEqual([]);
});
