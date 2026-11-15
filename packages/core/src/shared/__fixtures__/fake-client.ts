import type { CfBody } from "../../api/cf-request.ts";
import type { CfClient } from "../../api/client.ts";

/** One request the fake client received. */
export type Call = { body?: CfBody | undefined; method: string; path: string };

/** Answers a call with the result to return; throws to fail it like a CF error. */
export type Answer = (call: Call) => object | null;

export type FakeClient = { calls: Call[]; client: CfClient };

/** A `CfClient` for zone `zid` that records every request and answers each with `answer`; a throw rejects. */
export function fakeClient(answer: Answer): FakeClient {
  const calls: Call[] = [];
  const client: CfClient = {
    request: <T>(method: string, path: string, body?: CfBody): Promise<T> => {
      const call = { body, method, path };

      calls.push(call);

      try {
        return Promise.resolve(answer(call) as T /* the test names the shape the endpoint returns */);
      } catch (error) {
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    },
    zoneId: "zid",
  };

  return { calls, client };
}

/** The calls that changed something: everything but GET. */
export function writes(calls: Call[]): Call[] {
  return calls.filter((call) => call.method !== "GET");
}
