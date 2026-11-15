import type { ProductStack } from "./stack-candidate.ts";

/** The origin of each host the routes name, wildcards aside, in the origin's scheme and port. */
export function routeHosts(stack: ProductStack, origin: URL): string[] {
  const hosts = new Set(stack.routes.filter((route) => route.hostWildcard === false).map((route) => route.host));

  return [...hosts].toSorted().map((host) => {
    const url = new URL(origin);

    url.hostname = host;

    return url.origin;
  });
}
