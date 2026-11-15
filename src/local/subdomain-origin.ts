/**
 * The origin of `label` under `origin`'s host, on the same port: `http://example.localhost:8123` and `api` give
 * `http://api.example.localhost:8123`, as `example.com` gives `api.example.com`.
 */
export function subdomainOrigin(origin: URL, label: string): string {
  const sub = new URL(origin.origin);

  sub.hostname = `${label}.${origin.hostname}`;

  return sub.origin;
}
