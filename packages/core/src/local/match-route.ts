import type { LocalRoute } from "./local-route.ts";

function hostMatches(route: LocalRoute, host: string): boolean {
  if (route.hostWildcard === false) return host === route.host;

  const sub = host.endsWith(`.${route.host}`);

  return route.hostWildcard === "subdomains" ? sub : sub || host === route.host;
}

function pathMatches(route: LocalRoute, path: string): boolean {
  return route.prefix ? path.startsWith(route.path) : path === route.path;
}

function moreSpecific(a: LocalRoute, b: LocalRoute): boolean {
  if ((a.hostWildcard === false) !== (b.hostWildcard === false)) return a.hostWildcard === false;

  if (a.path.length !== b.path.length) return a.path.length > b.path.length;

  return !a.prefix && b.prefix;
}

function hostnameOf(host: string): string | undefined {
  try {
    return new URL(`http://${host}`).hostname;
  } catch {
    return undefined;
  }
}

/**
 * The route Cloudflare would pick for a request: among those matching the Host (its port ignored) and the path, an
 * exact host over a wildcard one, then the longer path, then an exact path over a prefix of the same length.
 */
export function matchRoute(routes: readonly LocalRoute[], host: string, path: string): LocalRoute | undefined {
  const hostname = hostnameOf(host);

  if (hostname === undefined) return undefined;

  const matching = routes.filter((route) => hostMatches(route, hostname) && pathMatches(route, path));

  return matching.find((route) => matching.every((other) => other === route || !moreSpecific(other, route)));
}
