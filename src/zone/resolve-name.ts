/**
 * Resolves shorthand DNS names to FQDNs.
 * `@` or `""` is the zone domain. A bare name gets the domain appended.
 */
export function resolveName(name: string, domain: string): string {
  if (name === "@" || name === "") return domain;

  if (name === domain) return name;

  if (name.endsWith(`.${domain}`)) return name;

  return `${name}.${domain}`;
}
