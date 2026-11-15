import { MS_PER_SECOND } from "../shared/ms-per-second.constants.ts";
import type { GoogleSession } from "./google-session.ts";
import { GOOGLE_TOKEN_URL } from "./google-token-url.constants.ts";
import { JWT_EXPIRY_S } from "./jwt-expiry-s.constants.ts";
import { signJwt } from "./sign-jwt.ts";

/** Exchanges a signed service account JWT for an access token with `scope`. */
export async function getGoogleAccessToken(session: GoogleSession, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / MS_PER_SECOND);

  const jwt = await signJwt(
    { aud: GOOGLE_TOKEN_URL, exp: now + JWT_EXPIRY_S, iat: now, iss: session.clientEmail, scope },
    session.privateKey,
  );

  const grant = encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer");

  const response = await session.fetcher(GOOGLE_TOKEN_URL, {
    body: `grant_type=${grant}&assertion=${encodeURIComponent(jwt)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });

  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Google token exchange failed (${response.status})`);
  }

  const data = (await response.json()) /* Google's token response */ as { access_token: string };

  return data.access_token;
}
