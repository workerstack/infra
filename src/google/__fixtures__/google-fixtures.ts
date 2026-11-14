import type { GoogleConfig } from "../../schema/google.ts";
import type { InfraEnv } from "../../schema/infra.ts";

/** A PEM-wrapped PKCS8 RSA key made for a test. */
export async function googlePrivateKey(): Promise<string> {
  const pair = await crypto.subtle.generateKey(
    { hash: "SHA-256", modulusLength: 2048, name: "RSASSA-PKCS1-v1_5", publicExponent: new Uint8Array([1, 0, 1]) },
    true,
    ["sign"],
  );
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  const body = btoa(Array.from(der, (byte) => String.fromCodePoint(byte)).join(""));

  return `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`;
}

/** A Google config with one prod client and a Search Console property, `example` names. */
export const googleConfig: GoogleConfig = {
  oauth: {
    prod: {
      authBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      clientId: "1234567890-abcdefghij.apps.googleusercontent.com",
      redirectOrigins: ["https://example.com"],
    },
  },
  searchConsole: {
    serviceAccountEmail: "infra@example.iam.gserviceaccount.com",
    sitemapUrls: ["https://example.com/sitemap.xml"],
    siteUrl: "sc-domain:example.com",
  },
};

/** An env whose global view holds `privateKey` (or no key). */
export function googleEnv(privateKey: string | undefined): InfraEnv {
  const global = privateKey === undefined ? {} : { GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: privateKey };

  return { dev: {}, global, local: {}, prod: {} };
}
