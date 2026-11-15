import type { CfFetch } from "../../api/cf-fetch.ts";

/** One request a route fake received: its method, URL, text body and init. */
export type RouteCall = { body: string; init: RequestInit; method: string; url: string };

/** What a route answers: a status and a text body. */
export type RouteAnswer = { body: string; status: number };

/** A local fake server: answers `METHOD url` from `routes` (a value or a function of the call), else 404; records calls. */
export function routeFetch(
  routes: Record<string, RouteAnswer | ((call: RouteCall) => RouteAnswer)>,
): { calls: RouteCall[]; fetcher: CfFetch } {
  const calls: RouteCall[] = [];

  return {
    calls,
    fetcher: (url, init) => {
      const call = { body: String(init.body ?? ""), init, method: init.method ?? "GET", url };

      calls.push(call);

      const route = routes[`${call.method} ${url}`];
      const answer = route instanceof Function ? route(call) : (route ?? { body: "", status: 404 });

      return Promise.resolve(new Response(answer.body, { status: answer.status }));
    },
  };
}
