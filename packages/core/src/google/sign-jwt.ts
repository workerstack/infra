import { base64urlBytes } from "../shared/base64url-bytes.ts";
import { pemToBuffer } from "../shared/pem-to-buffer.ts";

/** Signs `claims` as an RS256 JWT with a service account PEM key. */
export async function signJwt(claims: Record<string, number | string>, privateKeyPem: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBuffer(privateKeyPem),
    { hash: "SHA-256", name: "RSASSA-PKCS1-v1_5" },
    false,
    ["sign"],
  );

  const encoder = new TextEncoder();
  const header = base64urlBytes(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const body = base64urlBytes(encoder.encode(JSON.stringify(claims)));
  const signed = `${header}.${body}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(signed));

  return `${signed}.${base64urlBytes(new Uint8Array(signature))}`;
}
