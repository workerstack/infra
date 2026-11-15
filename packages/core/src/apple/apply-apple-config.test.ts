import { afterEach, expect, it, vi } from "vitest";

import { appleConfig, appleEnv, applePrivateKey } from "./__fixtures__/apple-fixtures.ts";
import { collectLines } from "./__fixtures__/collect-lines.ts";
import { jwtParts } from "./__fixtures__/jwt-parts.ts";
import { applyAppleConfig } from "./apply-apple-config.ts";
import { generateAppleClientSecret } from "./generate-apple-client-secret.ts";

afterEach(() => {
  vi.useRealTimers();
});

it("apply apple: prints each line and proves the key signs", async () => {
  const { lines, log } = collectLines();

  await applyAppleConfig({ config: appleConfig, env: appleEnv(await applePrivateKey()), log });

  expect(lines).toStrictEqual([
    "  OAuth:",
    "    [prod] Service ID: com.example.auth",
    "    [prod] Team ID: TEAM123456",
    "    [prod] Key ID: KEY1234567",
    "    [prod] Redirect origins: https://example.com, https://www.example.com",
    "    [prod] Client secret JWT: ✓ (key valid)",
  ]);
});

it("apply apple: prints the failure for a key that does not sign", async () => {
  const { lines, log } = collectLines();

  await applyAppleConfig({ config: appleConfig, env: appleEnv("not a key"), log });

  expect(lines.at(-1)).toMatch(/^ {4}\[prod\] Client secret JWT: ✗ /);
});

it("apply apple: throws the fix line when the scope has no private key", async () => {
  const { log } = collectLines();
  const run = applyAppleConfig({ config: appleConfig, env: appleEnv(undefined), log });

  await expect(run).rejects.toThrow(
    "APPLE_PRIVATE_KEY has no prod value; run bun repo env set APPLE_PRIVATE_KEY --scope prod",
  );
});

it("apply apple: prints nothing without oauth", async () => {
  const { lines, log } = collectLines();

  await applyAppleConfig({ config: {}, env: appleEnv(undefined), log });

  expect(lines).toStrictEqual([]);
});

it("apple client secret: an ES256 JWT with the Apple claims and a 6-month expiry", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

  const input = {
    keyId: "KEY1234567",
    privateKey: await applePrivateKey(),
    serviceId: "com.example.auth",
    teamId: "TEAM123456",
  };

  const { claims, header } = jwtParts(await generateAppleClientSecret(input));
  const iat = Date.parse("2026-01-01T00:00:00Z") / 1000;

  expect(header).toStrictEqual({ alg: "ES256", kid: "KEY1234567" });
  expect(claims).toStrictEqual({
    aud: "https://appleid.apple.com",
    exp: iat + 15_777_000,
    iat,
    iss: "TEAM123456",
    sub: "com.example.auth",
  });
});
