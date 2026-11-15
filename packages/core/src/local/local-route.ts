/**
 * A Worker's prod route, moved onto the product's local host: what the edge matches a request on, by the rules
 * Cloudflare uses to pick one route over another.
 */
export type LocalRoute = {
  /** The local host, or for a wildcard the host whose subdomains it covers. */
  host: string;
  /** `*.example.com` (subdomains only) or `*example.com` (the host and its subdomains). */
  hostWildcard: false | "subdomains" | "host-and-subdomains";
  /** The path, without a trailing `*`. */
  path: string;
  /** Whether the pattern ends in `*`, so it matches any path starting with `path`. */
  prefix: boolean;
  /** The Worker's name without its scope suffix (`web-api`), which several package dirs can share. */
  worker: string;
};
