import { base64urlBytes } from "../shared/base64url-bytes.ts";
import { MS_PER_SECOND } from "../shared/ms-per-second.constants.ts";
import { APPLE_CLIENT_SECRET_TTL_S } from "./apple-client-secret-ttl-s.constants.ts";
import { importAppleKey } from "./import-apple-key.ts";

/** What the Apple client-secret JWT is made of. */
type AppleSecretInput = { keyId: string; privateKey: string; serviceId: string; teamId: string };

/** Apple's `client_secret`: an ES256 JWT with a 6-month expiry. */
export async function generateAppleClientSecret(input: AppleSecretInput): Promise<string> {
  const key = await importAppleKey(input.privateKey);
  const now = Math.floor(Date.now() / MS_PER_SECOND);
  const encoder = new TextEncoder();
  const header = base64urlBytes(encoder.encode(JSON.stringify({ alg: "ES256", kid: input.keyId })));

  const payload = base64urlBytes(
    encoder.encode(
      JSON.stringify({
        aud: "https://appleid.apple.com",
        exp: now + APPLE_CLIENT_SECRET_TTL_S,
        iat: now,
        iss: input.teamId,
        sub: input.serviceId,
      }),
    ),
  );

  const signed = `${header}.${payload}`;
  const signature = await crypto.subtle.sign({ hash: "SHA-256", name: "ECDSA" }, key, encoder.encode(signed));

  return `${signed}.${base64urlBytes(new Uint8Array(signature))}`;
}
