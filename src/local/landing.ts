import { matchRoute } from "./match-route.ts";
import type { Landing, ProductStack } from "./stack-candidate.ts";

/** Where a request lands: the member serving the route Cloudflare would pick, the Worker left out, or nowhere. */
export function landing(stack: ProductStack, host: string, path: string): Landing | undefined {
  const route = matchRoute(stack.routes, host, path);

  if (route === undefined) return undefined;

  const member = stack.members.find((each) => each.worker === route.worker);

  if (member !== undefined) return { kind: "member", member };

  const out = stack.outside.get(route.worker);

  if (out === undefined) throw new Error(`route of ${route.worker} has no member and no outside`);

  return { kind: "outside", ...out };
}
