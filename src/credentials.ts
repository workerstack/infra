import type { InfraEnv, InfraScope } from "./schema/infra.ts";

export type CloudflareCredentials = {
  readonly accountEmail: string;
  readonly accountId: string;
  readonly apiKey: string;
  readonly apiToken: string | undefined;
};

/** The one required-key reader: an empty or missing global value throws the fix line. */
export function requiredGlobal(env: InfraEnv, key: string): string {
  const value = env.global[key];

  if (value === undefined || value === "")
    throw new Error(`${key} has no global value; run bun repo env set ${key} --scope global`);

  return value;
}

/** Reads the account credentials from `env.global` at call time. */
export function cloudflareCredentials(env: InfraEnv): CloudflareCredentials {
  const token = env.global.CLOUDFLARE_API_TOKEN;

  return {
    accountEmail: requiredGlobal(env, "CLOUDFLARE_ACCOUNT_EMAIL"),
    accountId: requiredGlobal(env, "CLOUDFLARE_ACCOUNT_ID"),
    apiKey: requiredGlobal(env, "CLOUDFLARE_API_KEY"),
    apiToken: token === "" ? undefined : token,
  };
}

/** The scoped required-key reader: an empty or missing value in the scope's view throws the fix line. */
export function requiredScoped(env: InfraEnv, scope: InfraScope, key: string): string {
  const value = env[scope][key];

  if (value === undefined || value === "")
    throw new Error(`${key} has no ${scope} value; run bun repo env set ${key} --scope ${scope}`);

  return value;
}
