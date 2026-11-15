import { cloudflareCredentials } from "../credentials.ts";
import type { InfraEnv } from "../schema/infra.ts";

/** How a request proves itself: a scoped API token, or the account email with its global key. */
export type CfAuth =
  | {
      /** The scoped API token. */
      token: string;
      /** Marks auth by API token. */
      type: "token";
    }
  | {
      /** The account email that owns the global key. */
      email: string;
      /** The account's global API key. */
      key: string;
      /** Marks auth by global key. */
      type: "global-key";
    };

/** The account's auth from `env.global`: the API token when set, else the global key. */
export function accountAuth(env: InfraEnv): CfAuth {
  const { accountEmail, apiKey, apiToken } = cloudflareCredentials(env);

  return apiToken === undefined
    ? { email: accountEmail, key: apiKey, type: "global-key" }
    : { token: apiToken, type: "token" };
}
