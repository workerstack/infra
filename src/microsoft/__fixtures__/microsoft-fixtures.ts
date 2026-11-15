import type { CfFetch } from "../../api/cf-fetch.ts";
import type { InfraEnv } from "../../schema/infra.ts";
import type { MicrosoftConfig } from "../../schema/microsoft.ts";
import { fakeInfraEnv } from "../../shared/__fixtures__/fake-infra-env.ts";

/** A prod Microsoft app whose `clientId` is `clientId`, `example` names. */
export function microsoftConfig(clientId: string): MicrosoftConfig {
  return {
    oauth: {
      prod: { appName: "Example App", clientId, redirectOrigins: ["https://example.com"], tenantId: "common" },
    },
  };
}

/** An env with the graph token and, optionally, the prod client secret. */
export function microsoftEnv(token: string | undefined, secret?: string): InfraEnv {
  return fakeInfraEnv({
    global: token === undefined ? {} : { MICROSOFT_GRAPH_API_TOKEN: token },
    prod: secret === undefined ? {} : { MICROSOFT_CLIENT_SECRET: secret },
  });
}

/** One request a Graph fake received. */
export type SentCall = { init: RequestInit; url: string };

/** A fetch that records requests and answers each with the next of `answers` (the last repeats). */
export function graphFetch(...answers: object[]): { calls: SentCall[]; fetcher: CfFetch } {
  const calls: SentCall[] = [];

  return {
    calls,
    fetcher: (url, init) => {
      const body = answers[Math.min(calls.length, answers.length - 1)] ?? {};

      calls.push({ init, url });

      return Promise.resolve(new Response(JSON.stringify(body)));
    },
  };
}
