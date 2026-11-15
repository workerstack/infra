import { BASE64URL_PADDING } from "./base64url-padding.constants.ts";

/** `bytes` as unpadded base64url. */
export function base64urlBytes(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(BASE64URL_PADDING, "");
}
