import { createAccountClient } from "../api/account-client.ts";
import { accountAuth } from "../api/auth.ts";
import { requiredGlobal } from "../credentials.ts";
import type { QueryDeps } from "./query-deps.ts";

/** The deps `infra logs-query` runs with: an account client signed with the product env's account auth. */
export function realQueryDeps(): QueryDeps {
  return {
    client: (env) => {
      const accountId = requiredGlobal(env, "CLOUDFLARE_ACCOUNT_ID");

      return createAccountClient(accountAuth(env), accountId);
    },
    now: () => Date.now(),
  };
}
