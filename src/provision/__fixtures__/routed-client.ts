import { fakeClient } from "../../shared/__fixtures__/fake-client.ts";
import type { FakeClient } from "../../shared/__fixtures__/fake-client.ts";

/** What a route answers: a result, or a function of the request's body. */
export type Routes = Record<string, Error | object | null>;

/**
 * A fake client that answers by `"METHOD /path"` (the query string is ignored) and fails any other request,
 * like Cloudflare failing an unknown route.
 */
export function routedClient(routes: Routes): FakeClient {
  return fakeClient(({ method, path }) => {
    const key = `${method} ${path.split("?")[0] ?? path}`;
    const answer = routes[key];

    if (answer === undefined) throw new Error(`unexpected: ${key}`);

    if (answer instanceof Error) throw answer;

    return answer;
  });
}
