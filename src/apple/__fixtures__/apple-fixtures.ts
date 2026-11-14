import type { InfraEnv } from "../../schema/infra.ts";
import type { AppleConfig } from "../../schema/apple.ts";

/** A PEM-wrapped PKCS8 P-256 key made for a test. */
export async function applePrivateKey(): Promise<string> {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  const body = btoa(Array.from(der, (byte) => String.fromCodePoint(byte)).join(""));

  return `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`;
}

/** A prod-only Apple config with `example` names. */
export const appleConfig: AppleConfig = {
  oauth: {
    prod: {
      keyId: "KEY1234567",
      redirectOrigins: ["https://example.com", "https://www.example.com"],
      serviceId: "com.example.auth",
      teamId: "TEAM123456",
    },
  },
};

/** An env whose prod view holds `privateKey` (or no key). */
export function appleEnv(privateKey: string | undefined): InfraEnv {
  return { dev: {}, global: {}, local: {}, prod: privateKey === undefined ? {} : { APPLE_PRIVATE_KEY: privateKey } };
}
