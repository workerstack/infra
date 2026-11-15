import { pemToBuffer } from "../shared/pem-to-buffer.ts";

/** Imports an Apple P-256 private key for signing; throws when the key is not valid. */
export function importAppleKey(privateKey: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("pkcs8", pemToBuffer(privateKey), { name: "ECDSA", namedCurve: "P-256" }, false, [
    "sign",
  ]);
}
