import { afterEach, expect, it, vi } from "vitest";

import { bodyText } from "./__fixtures__/body-text.ts";
import { googleFetch } from "./__fixtures__/google-fetch.ts";
import { googlePrivateKey } from "./__fixtures__/google-fixtures.ts";
import { jwtParts } from "./__fixtures__/jwt-parts.ts";
import { statusFetch } from "./__fixtures__/status-fetch.ts";
import { getGoogleAccessToken } from "./get-google-access-token.ts";

const CLIENT_EMAIL = "infra@example.iam.gserviceaccount.com";

afterEach(() => {
  vi.useRealTimers();
});

it("google token: POSTs a signed RS256 JWT with the service account claims", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

  const { calls, fetcher } = googleFetch(200, {});
  const session = { clientEmail: CLIENT_EMAIL, fetcher, privateKey: await googlePrivateKey() };
  const token = await getGoogleAccessToken(session, "scope1");
  const params = new URLSearchParams(bodyText(calls[0]?.init ?? {}));
  const { claims, header } = jwtParts(params.get("assertion") ?? "");
  const iat = Date.parse("2026-01-01T00:00:00Z") / 1000;

  expect(token).toBe("tok1");
  expect(calls[0]?.url).toBe("https://oauth2.googleapis.com/token");
  expect(calls[0]?.init.method).toBe("POST");
  expect(calls[0]?.init.headers).toStrictEqual({ "Content-Type": "application/x-www-form-urlencoded" });
  expect(params.get("grant_type")).toBe("urn:ietf:params:oauth:grant-type:jwt-bearer");
  expect(header).toStrictEqual({ alg: "RS256", typ: "JWT" });
  expect(claims).toStrictEqual({
    aud: "https://oauth2.googleapis.com/token",
    exp: iat + 3600,
    iat,
    iss: CLIENT_EMAIL,
    scope: "scope1",
  });
});

it("google token: throws with the status when the exchange fails", async () => {
  const session = { clientEmail: CLIENT_EMAIL, fetcher: statusFetch(401), privateKey: await googlePrivateKey() };

  await expect(getGoogleAccessToken(session, "s")).rejects.toThrow("Google token exchange failed (401)");
});
