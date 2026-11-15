import { accountAuth } from "../../api/auth.ts";
import { createAccountClient } from "../../api/account-client.ts";
import { type FakeFetch, fakeFetch } from "../../api/__fixtures__/fake-fetch.ts";
import { requiredGlobal } from "../../credentials.ts";
import type { QueryDeps } from "../query-deps.ts";

export const NOW = Date.UTC(2026, 10, 15, 10, 0, 0);

/** Query deps whose clients sign with the product env's account auth and send through one fake fetch. */
export function fakeQueryDeps(body: object): { deps: QueryDeps; fetch: FakeFetch } {
  const fake = fakeFetch(body);

  return {
    deps: {
      client: (env) => {
        const accountId = requiredGlobal(env, "CLOUDFLARE_ACCOUNT_ID");

        return createAccountClient(accountAuth(env), accountId, fake.fetcher);
      },
      now: () => NOW,
    },
    fetch: fake,
  };
}
