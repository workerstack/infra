import type { CfFetch } from "../../api/cf-fetch.ts";
import type { InfraEnv } from "../../schema/infra.ts";
import type { GithubConfig, GithubOAuthEnv } from "../../schema/github.ts";
import { fakeInfraEnv } from "../../shared/__fixtures__/fake-infra-env.ts";

/** A prod GitHub app whose `clientId` is `clientId`, `example` names. */
export function githubOAuth(clientId: string, extra: Partial<GithubOAuthEnv> = {}): GithubOAuthEnv {
  return {
    appName: "Example App",
    clientId,
    homepageUrl: "https://example.com",
    redirectOrigins: ["https://example.com", "https://www.example.com"],
    ...extra,
  };
}

/** A config with one prod scope. */
export function githubConfig(clientId: string, extra: Partial<GithubOAuthEnv> = {}): GithubConfig {
  return { oauth: { prod: githubOAuth(clientId, extra) } };
}

/** An env with, optionally, the prod client secret. */
export function githubEnv(secret?: string): InfraEnv {
  return fakeInfraEnv({ prod: secret === undefined ? {} : { GITHUB_CLIENT_SECRET: secret } });
}

/** One request a fake received. */
export type SentCall = { init: RequestInit; url: string };

/** A fetch that records requests and answers each with `status` and `body`. */
export function jsonFetch(status: number, body: object = {}): { calls: SentCall[]; fetcher: CfFetch } {
  const calls: SentCall[] = [];

  return {
    calls,
    fetcher: (url, init) => {
      calls.push({ init, url });

      return Promise.resolve(new Response(JSON.stringify(body), { status }));
    },
  };
}
